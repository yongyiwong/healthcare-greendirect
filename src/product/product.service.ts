import { S3 } from 'aws-sdk';
import { format } from 'date-fns';
import * as csvParse from 'csv-parse/lib/sync';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as s3Proxy from 's3-proxy';
import * as knox from 'knox';
import { EntityManager, Repository, UpdateResult } from 'typeorm';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  HttpService, LoggerService,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { Location } from '../entities/location.entity';
import { ProductGroup } from '../entities/product-group.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductPricingWeight } from '../entities/product-pricing-weight.entity';
import { ProductPricing } from '../entities/product-pricing.entity';
import { Product } from '../entities/product.entity';
import { GDExpectedException } from '../gd-expected.exception';
import { LocationInventoryStatsDto } from '../location/dto/location-inventory-stats.dto';
import { PricingType } from '../location/dto/location-search.dto';
import { LocationExceptions } from '../location/location.exceptions';
import { SRID } from '../location/location.service';
import { ProductGroupDto } from './dto/product-group.dto';
import { ProductPhotoPresignDto } from './dto/product-photo-presign.dto';
import { ProductDto } from './dto/product.dto';
import { ProductExceptions } from './product.exceptions';
import {
  SearchParams,
  DEFAULT_PARAMS,
} from '../common/search-params.interface';
import {
  SearchCountMapping,
  NO_CATEGORY,
  OTHER_CATEGORY,
} from '../common/search-count.dto';
import { countBy, capitalize, map, sortBy, defaults } from 'lodash';
import {GreenDirectLogger} from '../greendirect-logger';

declare module 'fs' {
  export function mkdirSync(folderPath: string, options: any): void;
}
@Injectable()
export class ProductService {
  s3client: S3;

  private config;
  private logger: LoggerService = new GreenDirectLogger('ProductService');

  constructor(
    protected readonly configService: ConfigService,
    @InjectRepository(Product)
    protected readonly productRepository: Repository<Product>,
    @InjectRepository(ProductPricing)
    protected readonly productPricingRepository: Repository<ProductPricing>,
    @InjectRepository(ProductPricingWeight)
    protected readonly productPricingWeightRepository: Repository<
      ProductPricingWeight
    >,
    @InjectRepository(ProductGroup)
    protected readonly productGroupRepository: Repository<ProductGroup>,
    @InjectRepository(ProductImage)
    protected readonly productImageRepository: Repository<ProductImage>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    protected readonly httpService: HttpService,
  ) {
    this.config = this.configService.get('storage.aws.s3');
    this.config.signatureVersion = 'v4'; // allow for browser upload
    this.s3client = new S3(this.config);
  }

  public async create(product: Product): Promise<Product> {
    delete product.id;
    if (product.category) product.category = product.category.trim();
    return this.productRepository.save(product);
  }

  public async update(product: Product): Promise<Product> {
    delete product.createdBy;
    if (product.category) product.category = product.category.trim();
    return this.productRepository.save(product);
  }

  public async remove(id: number, modifiedBy: number): Promise<UpdateResult> {
    return this.productRepository.update({ id }, { deleted: true, modifiedBy });
  }

  public async saveProducts(products: Product[]): Promise<Product[]> {
    try {
      products = products.map(product => {
        if (product.id) {
          delete product.created;
          delete product.createdBy;
        }
        if (product.category) product.category = product.category.trim();
        return product;
      });
      return this.productRepository.save(products);
    } catch (error) {
      throw error;
    }
  }

  async findWithFilter(
    searchParams: SearchParams,
  ): Promise<[ProductDto[], number]> {
    const {
      locationId,
      search,
      page,
      limit,
      paginated,
      order = 'name',
      includeAllStock,
      includeDeleted,
      includeHidden,
      productGroupId,
      brandId,
      category,
      startFromLat,
      startFromLong,
    } = defaults(searchParams, DEFAULT_PARAMS);

    try {
      const offset = page * limit;
      /**
       * Separated out product image and product pricing queries. The joins
       * across product pricing/weights and images were creating compounded
       * results slowing down the query. separating them returns less rows
       * per query and response time has increased by 5x.
       */
      const imageQuery = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.productGroup', 'productGroup')
        .leftJoinAndSelect('product.location', 'location');

      const productQuery = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect(
          'pricing.weightPrices',
          'weights',
          'weights.deleted = false and weights.price > 0',
        )
        .leftJoinAndSelect('product.productGroup', 'productGroup')
        .leftJoinAndSelect('product.location', 'location')
        .leftJoinAndSelect('location.state', 'state');

      if (order) {
        const [column, value = 'ASC'] = order.split(' ');
        const orderValue = value.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (column === 'price') {
          const queryWeightPrices = subquery =>
            subquery
              .addSelect([
                '"weightPrices".product_pricing_id as "pricingId"',
                'MIN(weightPrices.price) as "minPrice"',
              ])
              .from(ProductPricingWeight, 'weightPrices')
              .where('weightPrices.deleted = false and weightPrices.price > 0')
              .groupBy('"weightPrices".product_pricing_id');
          productQuery.leftJoin(
            queryWeightPrices,
            'weightPrices',
            'pricing.id = "weightPrices"."pricingId"',
          );

          const priceClause = `
            CASE
              WHEN
                product.pricingType='${PricingType.Weight}'
                AND "weightPrices"."minPrice" IS NOT NULL
                AND "weightPrices"."minPrice" != 0
                THEN "weightPrices"."minPrice"
              WHEN (
                product.pricingType='${PricingType.Unit}'
                OR "weightPrices"."minPrice" IS NULL
              ) AND pricing.price IS NOT NULL
                AND pricing.price != 0
                THEN pricing.price
              ELSE NULL
            END`;
          productQuery
            .addSelect(priceClause, 'price')
            .orderBy('price', orderValue, 'NULLS LAST');
        } else {
          productQuery.orderBy('product.' + column, orderValue);
        }
      }

      if (!includeHidden) {
        imageQuery.andWhere('product.hidden = false');
        productQuery.andWhere('product.hidden = false');
      }

      if (!includeDeleted) {
        imageQuery.andWhere('product.deleted = false');
        productQuery.andWhere('product.deleted = false');
      }

      if (search) {
        const REGEX_ALL_SPACES = /\s+/g;
        const spacesAsWildcardsTerm = search
          .trim()
          .replace(REGEX_ALL_SPACES, '%');
        const filter = '%' + spacesAsWildcardsTerm + '%';
        productQuery.andWhere('product.name ILIKE :filter', { filter });
      }

      if (productGroupId) {
        imageQuery.andWhere('product.productGroup = :productGroupId ', {
          productGroupId,
        });
        productQuery.andWhere('product.productGroup = :productGroupId ', {
          productGroupId,
        });
      }

      if (brandId) {
        imageQuery.andWhere('productGroup.brand = :brandId', {
          brandId,
        });
        productQuery.andWhere('productGroup.brand = :brandId', {
          brandId,
        });
      }

      if (locationId) {
        imageQuery.andWhere('product.location_id = :locationId', {
          locationId,
        });
        productQuery.andWhere('product.location_id = :locationId', {
          locationId,
        });
      }

      if (!includeAllStock) {
        // return only in-stock products by default
        imageQuery.andWhere('product.is_in_stock = true');
        productQuery.andWhere('product.is_in_stock = true');
      } else {
        // assumingly this is called from Admin
        productQuery.take(limit).skip(offset);
      }

      // this is called exclusively from WEB search
      if (paginated) {
        productQuery.andWhere('location.deleted = false');
        productQuery.take(limit).skip(offset);
      }

      if (category) {
        imageQuery.andWhere('LOWER(product.category) = LOWER(:category)', {
          category,
        });
        productQuery.andWhere('LOWER(product.category) = LOWER(:category)', {
          category,
        });
      }

      if (startFromLat || startFromLong) {
        const longLat = { startFromLat, startFromLong };
        GDExpectedException.try(
          LocationExceptions.invalidStartingLatLong,
          longLat,
        );
        const distanceClause = `
        CASE WHEN long_lat IS NULL THEN NULL ELSE (ST_DistanceSphere(
          ST_SetSrid(ST_MakePoint(long_lat[0], long_lat[1]), ${SRID}),
          ST_SetSrid(ST_MakePoint(${startFromLong}, ${startFromLat}), ${SRID})
          ) / 1000.0)
        END`;
        imageQuery
          .addSelect(distanceClause, 'distance')
          .orderBy('distance', 'ASC', 'NULLS LAST');
        productQuery
          .addSelect(distanceClause, 'distance')
          .orderBy('distance', 'ASC', 'NULLS LAST');
      }
      const count = await productQuery.getCount();
      const productImages = await imageQuery.getMany();
      const rawAndEntities = await productQuery.getRawAndEntities(); // plain entity columns
      const finalEntities = this.mapRawAndSubqueriesToDto(
        rawAndEntities,
        productImages,
      ); // map to one list + complex subqueries

      return [finalEntities, count];
    } catch (error) {
      throw error;
    }
  }

  async getAllProducts(
    searchParams: SearchParams,
  ): Promise<[ProductDto[], number]> {
    const {
      // locationId,
      search,
      page,
      limit,
      paginated,
      order = 'name',
      includeAllStock,
      includeDeleted,
      includeHidden,
      productGroupId,
      brandId,
      category,
      startFromLat,
      startFromLong,
    } = defaults(searchParams, DEFAULT_PARAMS);

    // search,
    // page,
    // limit,
    // order,
    // includeAllStock,
    // includeDeleted,
    // includeHidden,
    // category,

    try {
      const offset = page * limit;
      /**
       * Separated out product image and product pricing queries. The joins
       * across product pricing/weights and images were creating compounded
       * results slowing down the query. separating them returns less rows
       * per query and response time has increased by 5x.
       */
      const imageQuery = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.productGroup', 'productGroup')
        .leftJoinAndSelect('product.location', 'location');

      const productQuery = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect(
          'pricing.weightPrices',
          'weights',
          'weights.deleted = false and weights.price > 0',
        )
        .leftJoinAndSelect('product.productGroup', 'productGroup')
        .leftJoinAndSelect('product.location', 'location')
        .leftJoinAndSelect('location.state', 'state');

      if (order) {
        const [column, value = 'ASC'] = order.split(' ');
        const orderValue = value.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (column === 'price') {
          const queryWeightPrices = subquery =>
            subquery
              .addSelect([
                '"weightPrices".product_pricing_id as "pricingId"',
                'MIN(weightPrices.price) as "minPrice"',
              ])
              .from(ProductPricingWeight, 'weightPrices')
              .where('weightPrices.deleted = false and weightPrices.price > 0')
              .groupBy('"weightPrices".product_pricing_id');
          productQuery.leftJoin(
            queryWeightPrices,
            'weightPrices',
            'pricing.id = "weightPrices"."pricingId"',
          );

          const priceClause = `
            CASE
              WHEN
                product.pricingType='${PricingType.Weight}'
                AND "weightPrices"."minPrice" IS NOT NULL
                AND "weightPrices"."minPrice" != 0
                THEN "weightPrices"."minPrice"
              WHEN (
                product.pricingType='${PricingType.Unit}'
                OR "weightPrices"."minPrice" IS NULL
              ) AND pricing.price IS NOT NULL
                AND pricing.price != 0
                THEN pricing.price
              ELSE NULL
            END`;
          productQuery
            .addSelect(priceClause, 'price')
            .orderBy('price', orderValue, 'NULLS LAST');
        } else {
          productQuery.orderBy('product.' + column, orderValue);
        }
      }

      if (!includeHidden) {
        imageQuery.andWhere('product.hidden = false');
        productQuery.andWhere('product.hidden = false');
      }

      if (!includeDeleted) {
        imageQuery.andWhere('product.deleted = false');
        productQuery.andWhere('product.deleted = false');
      }

      if (search) {
        const REGEX_ALL_SPACES = /\s+/g;
        const spacesAsWildcardsTerm = search
          .trim()
          .replace(REGEX_ALL_SPACES, '%');
        const filter = '%' + spacesAsWildcardsTerm + '%';
        productQuery.andWhere('product.name ILIKE :filter', { filter });
      }

      if (productGroupId) {
        imageQuery.andWhere('product.productGroup = :productGroupId ', {
          productGroupId,
        });
        productQuery.andWhere('product.productGroup = :productGroupId ', {
          productGroupId,
        });
      }

      if (brandId) {
        imageQuery.andWhere('productGroup.brand = :brandId', {
          brandId,
        });
        productQuery.andWhere('productGroup.brand = :brandId', {
          brandId,
        });
      }

      // if (locationId) {
      //   imageQuery.andWhere('product.location_id = :locationId', {
      //     locationId,
      //   });
      //   productQuery.andWhere('product.location_id = :locationId', {
      //     locationId,
      //   });
      // }

      if (!includeAllStock) {
        // return only in-stock products by default
        imageQuery.andWhere('product.is_in_stock = true');
        productQuery.andWhere('product.is_in_stock = true');
      } else {
        // assumingly this is called from Admin
        productQuery.take(limit).skip(offset);
      }

      // this is called exclusively from WEB search
      if (paginated) {
        productQuery.andWhere('location.deleted = false');
        productQuery.take(limit).skip(offset);
      }

      if (category) {
        imageQuery.andWhere('LOWER(product.category) = LOWER(:category)', {
          category,
        });
        productQuery.andWhere('LOWER(product.category) = LOWER(:category)', {
          category,
        });
      }

      if (startFromLat || startFromLong) {
        const longLat = { startFromLat, startFromLong };
        GDExpectedException.try(
          LocationExceptions.invalidStartingLatLong,
          longLat,
        );
        const distanceClause = `
        CASE WHEN long_lat IS NULL THEN NULL ELSE (ST_DistanceSphere(
          ST_SetSrid(ST_MakePoint(long_lat[0], long_lat[1]), ${SRID}),
          ST_SetSrid(ST_MakePoint(${startFromLong}, ${startFromLat}), ${SRID})
          ) / 1000.0)
        END`;
        imageQuery
          .addSelect(distanceClause, 'distance')
          .orderBy('distance', 'ASC', 'NULLS LAST');
        productQuery
          .addSelect(distanceClause, 'distance')
          .orderBy('distance', 'ASC', 'NULLS LAST');
      }
      const count = await productQuery.getCount();
      const productImages = await imageQuery.getMany();
      const rawAndEntities = await productQuery.getRawAndEntities(); // plain entity columns
      const finalEntities = this.mapRawAndSubqueriesToDto(
        rawAndEntities,
        productImages,
      ); // map to one list + complex subqueries

      return [finalEntities, count];
    } catch (error) {
      throw error;
    }
  }

  private mapRawAndSubqueriesToDto(
    {
      entities,
      raw,
    }: {
      entities: Product[];
      raw: any[];
    },
    productImages: Product[],
  ): ProductDto[] {
    try {
      const mappedDtos = entities.map(product => {
        const location: Location = product.location;

        const locationProductId = !!location ? location.id : null;
        const productWithImages = productImages.find(p => p.id === product.id);
        const productDto: ProductDto = {
          ...product,
          location,
          images:
            productWithImages && productWithImages.images
              ? productWithImages.images
              : [],
        };

        const { price } = raw.find(r => r.product_id === product.id) || {
          price: null,
        };
        productDto.price = price;

        const { distance } = raw.find(
          r => r.location_id === locationProductId,
        ) || { distance: null };

        if (productDto.location) {
          productDto.location.distance = distance;
        }

        return productDto;
      });
      return mappedDtos;
    } catch (error) {
      throw error;
    }
  }

  public async getLocationForProduct(productId: number): Promise<Location> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.location', 'location')
      .where('product.id = :productId', { productId })
      .getOne();
    if (!product) throw new BadRequestException('no product found.');
    return new Promise<Location>(resolve => resolve(product.location));
  }

  public async getLocationForProductWeight(
    productPricingWeightId: number,
  ): Promise<Location> {
    const product = await this.getProductForWeight(productPricingWeightId);
    if (!product) throw new BadRequestException('no product found.');
    return new Promise<Location>(resolve => resolve(product.location));
  }

  public async getProductForWeight(
    productPricingWeightId: number,
  ): Promise<Product> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.location', 'location')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('pricing.weightPrices', 'weights')
      .leftJoinAndSelect('product.images', 'images')
      .where('weights.id = :productPricingWeightId', { productPricingWeightId })
      .getOne();
  }

  public async findById(
    productId: number,
    locationId?: number,
    productGroupId?: number,
    brandId?: number,
    includeHidden?: boolean,
    includeDeletedWeightPrices?: boolean,
  ): Promise<Product> {
    try {
      if (!productId) throw new BadRequestException('id not provided');
      const query = this.productRepository.createQueryBuilder('product');
      query
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect(
          'pricing.weightPrices',
          'weights',
          !includeDeletedWeightPrices ? 'weights.deleted = false' : null,
        )
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect(
          'product.productGroup',
          'productGroup',
          'productGroup.deleted = false',
        )
        .leftJoinAndSelect(
          'productGroup.brand',
          'brand',
          'brand.deleted = false',
        )
        .leftJoinAndSelect('product.location', 'location')
        .leftJoinAndSelect('location.state', 'state')
        .where('product.id = :productId', { productId });

      if (locationId) {
        query.andWhere('product.location_id = :locationId', { locationId });
      }
      if (productGroupId) {
        query.andWhere('productGroup.id = :productGroupId', {
          productGroupId,
        });
      }
      if (brandId) {
        query.andWhere('brand.id = :brandId', {
          brandId,
        });
      }
      if (!includeHidden) {
        query.andWhere('product.hidden = false');
      }
      const result = await query.getOne();
      GDExpectedException.try(ProductExceptions.productNotFound, result);
      return Promise.resolve(result);
    } catch (error) {
      throw error;
    }
  }

  public async getInventoryStats(
    locationId: number,
  ): Promise<LocationInventoryStatsDto> {
    const locationInventoryStats = await this.productRepository
      .createQueryBuilder('product')
      .select([
        'location_id as "locationId"',
        'COUNT(NULLIF(is_in_stock = FALSE, TRUE)) as "inStockCount"',
        'COUNT(NULLIF(is_in_stock = TRUE, TRUE)) as "outOfStockCount"',
      ])
      .where('location_id = :locationId', { locationId })
      .groupBy('location_id')
      .getRawOne();
    return Promise.resolve(locationInventoryStats);
  }

  public async getProductCategories(
    locationId?: number,
    brandId?: number,
    includeAllStock?: boolean,
    includeHidden?: boolean,
    includeDeleted?: boolean,
  ): Promise<string[]> {
    const table = brandId ? 'productGroup' : 'product';
    const query = this.entityManager
      .createQueryBuilder(brandId ? ProductGroup : Product, table)
      .select([`DISTINCT TRIM(${table}.category) as category`])
      .where(`${table}.category IS NOT NULL`)
      .orderBy('category');

    if (brandId) {
      query
        .innerJoin(
          productQuery => {
            if (!includeAllStock) {
              productQuery.andWhere(
                `product.isInStock = true AND product.deleted = false AND product.hidden = false`,
              );
            }
            return productQuery
              .select('DISTINCT product.product_group_id as "productGroupId"')
              .from(Product, 'product');
          },
          'product',
          `${table}.id = "product"."productGroupId"`,
        )
        .andWhere(`${table}.brand = :brandId`, { brandId });
    } else {
      if (locationId) {
        query.andWhere(`${table}.location = :locationId`, { locationId });
      }

      if (!includeAllStock) {
        query.andWhere(`${table}.isInStock = true`);
      }

      if (!includeHidden) {
        query.andWhere(`${table}.hidden = false`);
      }
    }

    if (!includeDeleted) {
      query.andWhere(`${table}.deleted = false`);
    }

    const result = await query.getRawMany();
    const categories = result.map(row => row.category);
    return categories;
  }

  public async findProductGroupById(
    productGroupId: number,
    brandId?: number,
  ): Promise<ProductGroup> {
    try {
      const query = this.productGroupRepository
        .createQueryBuilder('productGroup')
        .leftJoinAndSelect('productGroup.brand', 'brand')
        .where('productGroup.deleted = false')
        .andWhere('productGroup.id = :productGroupId', {
          productGroupId,
        });
      if (brandId) {
        query.andWhere('brand.id = :brandId and brand.deleted = false', {
          brandId,
        });
      }
      const result = await query.getOne();
      GDExpectedException.try(ProductExceptions.productNotFound, result);
      return Promise.resolve(result);
    } catch (error) {
      throw error;
    }
  }

  public async getProductsByProductGroup(
    search?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
    includeAllStock?: boolean,
    productGroupId?: number,
    brandId?: number,
    startFromLat?: number,
    startFromLong?: number,
  ): Promise<[ProductDto[], number]> {
    try {
      const productsResult = await this.findWithFilter({
        search,
        page,
        limit,
        order,
        includeAllStock,
        includeDeleted: false,
        includeHidden: false,
        productGroupId,
        brandId,
        startFromLat,
        startFromLong,
      });
      const products = _.isEmpty(productsResult[0]) ? [] : productsResult[0];
      const distinctProducts = _.uniqBy(products, 'location.id');

      return [distinctProducts, distinctProducts.length];
    } catch (error) {
      throw error;
    }
  }

  public async savePhotos(
    productId: number,
    photos: ProductImage[],
    userId: number,
  ): Promise<ProductImage[]> {
    try {
      const formattedPhotos: ProductImage[] = photos.map(photo => {
        const productImage: ProductImage = {
          ...new ProductImage(),
          id: photo.id || null,
          product: { id: productId } as Product,
          size: photo.size,
          url: photo.url,
          createdBy: userId,
          modifiedBy: userId,
        };

        if (photo.id) {
          delete productImage.createdBy;
        }

        return productImage;
      });
      return this.productImageRepository.save(formattedPhotos);
    } catch (error) {
      throw error;
    }
  }

  public async createPresignedPost(
    presignDto: ProductPhotoPresignDto,
    expiration: number = 3600,
  ): Promise<any> {
    const PHOTO_TYPE = presignDto.size;
    const timestamp = format(new Date(), 'YYYYMMDDHHmmss');
    const fileKey = `${presignDto.productId}_${PHOTO_TYPE}_${timestamp +
      path.extname(presignDto.name)}`;
    const endpoint = this.configService.get('storage.endpoint');
    const params = {
      Bucket: this.config.bucket,
      Key: 'products/' + fileKey,
      Expires: expiration,
    };
    return {
      destinationUrl: `${endpoint}/api/products/photo/file/${fileKey}`,
      signedUrl: this.s3client.getSignedUrl('putObject', params),
    };
  }

  public proxyFile(fileKey: string, request, response, next) {
    request.originalUrl = '/products/' + fileKey;
    const options = {
      ...this.config,
    };
    s3Proxy(options)(request, response, error => {
      if (error && error.status === 404) {
        response.type('json');
        return next(new NotFoundException());
      }
      next(error);
    });
  }

  public async getSearchCount(
    searchParams: SearchParams,
  ): Promise<SearchCountMapping> {
    const { search, category } = searchParams;

    if (!search) {
      return { count: 0 };
    }

    const [products, count] = await this.findWithFilter({
      search,
      category,
      limit: null,
      page: null,
      paginated: true,
    });

    const categoryCounts = countBy(
      sortBy(products, product => product.category || null),
      'category',
    );
    const noCategoryCount = categoryCounts[NO_CATEGORY];
    if (categoryCounts[OTHER_CATEGORY]) {
      delete categoryCounts[NO_CATEGORY];
    }

    const categories = [];
    map(categoryCounts, (value, categ) => {
      const selectedCategory = categ.replace(/\w+/g, capitalize);
      const existingCategoryIndex = categories.findIndex(
        c => Object.keys(c)[0] === selectedCategory,
      );

      if (existingCategoryIndex === -1) {
        categories.push({
          [selectedCategory || OTHER_CATEGORY]:
            selectedCategory === OTHER_CATEGORY && noCategoryCount
              ? value + noCategoryCount
              : value,
        });
      } else {
        const prevValue = categories[existingCategoryIndex][selectedCategory];
        categories[existingCategoryIndex][selectedCategory] = prevValue + value;
      }
    });

    return {
      count,
      categories,
    };
  }

  /**
   * Export a specific location's product photos to file system with CSV index
   * @param locationId
   * @param exportPath
   */
  public async exportProductPhotos(locationId: number, exportPath: string) {
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }
    const imagesPath = path.join(exportPath, 'images');
    if (!fs.existsSync(imagesPath)) {
      fs.mkdirSync(imagesPath);
    }

    const products = await this.productRepository.find({
      relations: ['images'],
      where: { location: { id: locationId } },
    });
    const csv = [];
    csv.push(['location_id', 'pos_id', 'size', 'file_path', 'url'].join(','));
    let count = 0;
    for (const product of products) {
      for (const productImage of product.images) {
        if (productImage.url) {
          const result = await this.httpService.axiosRef.get(productImage.url, {
            headers: {
              'Content-Type': 'image/jpeg',
            },
            responseType: 'stream',
          });
          const filename = path.basename(productImage.url);
          const filePath = path.join(imagesPath, filename);
          result.data.pipe(fs.createWriteStream(filePath));
          csv.push(
            [
              locationId,
              product.posId,
              productImage.size,
              filePath,
              productImage.url,
            ].join(','),
          );
        }
      }
      count++;
      this.logger.log(
        `saving images for product ${count}/${products.length}`,
      );
    }
    const csvText = csv.join('\n');
    const filePath = `${exportPath}/product_images.csv`;
    fs.writeFileSync(filePath, csvText);
    this.logger.log(`exportProductPhotos results: ${products.length}`);
  }

  /**
   * Import product photos for a specific location. CSV format should
   * conform to exportProductPhotos()
   * @param locationId
   * @param csvPath
   */
  public async importProductPhotos(locationId: number, csvPath: string) {
    const fileData = fs.readFileSync(csvPath, 'utf8');
    const records = csvParse(fileData, {
      columns: true,
      skip_empty_lines: true,
    });
    const endpoint = this.configService.get('storage.endpoint');
    let count = 0;
    for (const row of records) {
      count++;
      // check if image record already exists and if so, ignore
      const product = await this.productRepository.findOne({
        relations: ['images'],
        where: { posId: row.pos_id, location: { id: locationId } },
      });
      if (!product || _.find(product.images, { size: row.size })) {
        this.logger.log(
          `skipping product pos_id = ${row.pos_id} with size ${row.size}`,
        );
        continue;
      }
      // no image records so add them
      const timestamp = format(new Date(), 'YYYYMMDDHHmmss');
      const extension = path.extname(row.file_path);
      const newFilename = `${product.id}_${row.size}_${timestamp}${extension}`;
      const destinationKey = `products/${newFilename}`;
      const productImage = new ProductImage();
      productImage.product = product;
      productImage.size = row.size;
      productImage.url = `${endpoint}/api/products/photo/file/${newFilename}`;
      productImage.createdBy = 1; // default to admin
      productImage.modifiedBy = 1; // default to admin

      this.logger.log(
        `saving product image ${count}/${records.length}: ${destinationKey}`,
      );
      await this.entityManager.transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(productImage);
        await this.uploadFileToS3(row.file_path, destinationKey);
      });
    }
  }

  /**
   * Helper method to upload file to S3
   * @param filePath
   * @param destinationKey
   */
  private async uploadFileToS3(
    filePath: string,
    destinationKey: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const knoxClient = knox.createClient({
        key: this.config.accessKeyId,
        secret: this.config.secretAccessKey,
        region: this.config.region,
        bucket: this.config.bucket,
      });
      knoxClient.putFile(filePath, destinationKey, (error, result) => {
        if (error) {
          return reject(error);
        } else if (result.statusCode !== 200) {
          return reject(
            new Error(
              `Failed upload ${destinationKey} with status code ${result.statusCode}`,
            ),
          );
        } else {
          resolve(result);
        }
      });
    });
  }
}
