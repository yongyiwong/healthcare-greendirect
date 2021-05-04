import * as path from 'path';
import * as s3Proxy from 's3-proxy';
import * as _ from 'lodash';
import { ConfigService } from '@sierralabs/nest-utils';
import { format } from 'date-fns';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { S3 } from 'aws-sdk';

import { GDExpectedException } from '../gd-expected.exception';
import { ProductGroup } from '../entities/product-group.entity';
import { ProductGroupPresignedDto } from './dto/product-group-presign.dto';
import { ProductExceptions } from './product.exceptions';
import { ProductGroupDto } from './dto/product-group.dto';
import { PricingType } from '../location/dto/location-search.dto';
import { ProductPricingWeight } from '../entities/product-pricing-weight.entity';
import { Product } from '../entities/product.entity';
import { SearchParams } from '../common/search-params.interface';

@Injectable()
export class ProductGroupService {
  s3client: S3;
  constructor(
    @InjectRepository(ProductGroup)
    protected readonly productGroupRepository: Repository<ProductGroup>,
    protected readonly configService: ConfigService,
  ) {
    const config = configService.get('storage.aws.s3');
    config.signatureVersion = 'v4'; // to allow for browser upload
    this.s3client = new S3(config);
  }

  public async getProductGroups(
    searchParams: SearchParams,
  ): Promise<[ProductGroupDto[], number]> {
    searchParams = _.defaults(searchParams, { order: 'name' });

    try {
      const query = this.productGroupRepository
        .createQueryBuilder('productGroup')
        .leftJoinAndSelect(
          'productGroup.brand',
          'brand',
          'brand.deleted = false',
        )
        .leftJoinAndSelect('productGroup.products', 'products')
        .leftJoinAndSelect(
          'products.location',
          'location',
          'location.deleted = false',
        );

      if (searchParams.brandId) {
        query.andWhere('productGroup.brand = :brandId', {
          brandId: searchParams.brandId,
        });
      } else {
        if (searchParams.unassigned) {
          query.andWhere('productGroup.brand IS NULL');
        }
      }

      if (searchParams.search) {
        const filter = '%' + searchParams.search + '%';
        query.andWhere(`productGroup.name ILIKE :filter`, {
          filter,
        });
      }

      if (searchParams.order) {
        const [column, value = 'ASC'] = searchParams.order.split(' ');
        const orderValue = value.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (column === 'price') {
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

          const queryWeightPrices = subquery =>
            subquery
              .addSelect([
                '"weightPrices".product_pricing_id as "pricingId"',
                'MIN(weightPrices.price) as "minPrice"',
              ])
              .from(ProductPricingWeight, 'weightPrices')
              .where('weightPrices.deleted = false and weightPrices.price > 0')
              .groupBy('"weightPrices".product_pricing_id');

          const queryProducts = productQuery =>
            productQuery
              .addSelect([
                '"product".product_group_id',
                priceClause + ' as "sortPrice"',
              ])
              .from(Product, 'product')
              .leftJoin('product.pricing', 'pricing')
              .leftJoin(
                queryWeightPrices,
                'weightPrices',
                'pricing.id = "weightPrices"."pricingId"',
              );

          const queryProductGroup = productGroupQuery =>
            productGroupQuery
              .addSelect(['productGroup.id as "productGroupId"'])
              .from(ProductGroup, 'productGroup')
              .leftJoin(
                queryProducts,
                'product',
                'productGroup.id = "product".product_group_id',
              )
              .addSelect('MIN("sortPrice") as price')
              .groupBy('productGroup.id');

          query
            .leftJoinAndSelect(
              queryProductGroup,
              'productGroupQuery',
              'productGroup.id = "productGroupQuery"."productGroupId"',
            )
            .orderBy('price', orderValue, 'NULLS LAST');
        } else {
          query.orderBy('productGroup.' + column, orderValue);
        }
      }

      if (searchParams.category) {
        query.andWhere('LOWER(productGroup.category) = LOWER(:category)', {
          category: searchParams.category,
        });
      }

      if (!searchParams.includeAllStock) {
        query.andWhere(
          'products.isInStock = true and products.deleted = false and products.hidden = false',
        );
      }

      if (!searchParams.includeDeleted) {
        query.andWhere('productGroup.deleted = false');
      }

      const count = await query.getCount();
      const rawAndEntities = await query.getRawAndEntities(); // plain entity columns
      const finalEntities = this.productGroupMapResult(rawAndEntities); // map to one list + complex subqueries

      return [finalEntities, count];
    } catch (error) {
      throw error;
    }
  }

  private productGroupMapResult({
    entities,
    raw,
  }: {
    entities: ProductGroup[];
    raw: any[];
  }): ProductGroupDto[] {
    try {
      const mappedDtos = entities.map(group => {
        const productGroupDto: ProductGroupDto = group;
        const { price } = raw.find(r => r.productGroup_id === group.id) || {
          price: null,
        };
        productGroupDto.price = price;
        return productGroupDto;
      });
      return mappedDtos;
    } catch (error) {
      throw error;
    }
  }

  public async findById(id: number, brandId?: number): Promise<ProductGroup> {
    try {
      const query = this.productGroupRepository
        .createQueryBuilder('productGroup')
        .leftJoinAndSelect('productGroup.products', 'products')
        .leftJoinAndSelect('products.images', 'images')
        .leftJoinAndSelect('products.location', 'location')
        .where('productGroup.id = :id', { id });
      if (brandId) {
        query.andWhere('productGroup.brand = :brandId', {
          brandId,
        });
      }
      const result = await query.getOne();
      GDExpectedException.try(ProductExceptions.productNotFound, result);
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async create(productGroup: ProductGroup): Promise<ProductGroup> {
    delete productGroup.id;
    try {
      if (productGroup.category)
        productGroup.category = productGroup.category.trim();
      return this.productGroupRepository.save(productGroup);
    } catch (error) {
      throw error;
    }
  }

  public async update(productGroup: ProductGroup): Promise<ProductGroup> {
    delete productGroup.createdBy;
    delete productGroup.created;
    try {
      if (productGroup.category)
        productGroup.category = productGroup.category.trim();
      return this.productGroupRepository.save(productGroup);
    } catch (error) {
      throw error;
    }
  }

  public async remove(id: number, modifiedBy: number): Promise<UpdateResult> {
    try {
      return this.productGroupRepository.update(
        { id },
        { deleted: true, modifiedBy },
      );
    } catch (error) {
      throw error;
    }
  }

  public async createPresignedPost(
    presignDto: ProductGroupPresignedDto,
    expiration: number = 3600,
  ): Promise<any> {
    const PHOTO_TYPE = 'image';
    const timestamp = format(new Date(), 'YYYYMMDDHHmmss');
    let fileKey = `${presignDto.productGroupId}_${PHOTO_TYPE}_`;
    fileKey += timestamp + path.extname(presignDto.name);
    const config = this.configService.get('storage.aws.s3');
    const endpoint = this.configService.get('storage.endpoint');
    const params = {
      Bucket: config.bucket,
      Key: 'product-groups/' + fileKey,
      Expires: expiration,
    };
    return {
      destinationUrl: `${endpoint}/api/product-groups/photo/file/${fileKey}`,
      signedUrl: this.s3client.getSignedUrl('putObject', params),
    };
  }

  public proxyFile(fileKey: string, request, response, next) {
    request.originalUrl = '/product-groups/' + fileKey;
    const options = {
      ...this.configService.get('storage.aws.s3'),
    };
    s3Proxy(options)(request, response, error => {
      if (error && error.status === 404) {
        response.type('json');
        return next(new NotFoundException());
      }
      next(error);
    });
  }
}
