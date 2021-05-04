import * as path from 'path';
import * as s3Proxy from 's3-proxy';
import * as _ from 'lodash';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, UpdateResult } from 'typeorm';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@sierralabs/nest-utils';
import { BrandPresignedDto } from './dto/brand-presign.dto';
import { format } from 'date-fns';

import { Brand, RANDOM_PRIORITY_OPTION } from '../entities/brand.entity';
import { GDExpectedException } from '../gd-expected.exception';
import { BrandExceptions } from './brand.exceptions';
import { Product } from '../entities/product.entity';
import { LocationSearchDto } from '../location/dto/location-search.dto';
import { LocationExceptions } from '../location/location.exceptions';
import { SRID } from '../location/location.service';
import { HoursService } from '../location/hours/hours.service';
import { ProductService } from '../product/product.service';
import {
  SearchParams,
  DEFAULT_PARAMS,
} from '../common/search-params.interface';
import { SearchCountMapping } from '../common/search-count.dto';
import { defaults } from 'lodash';

@Injectable()
export class BrandService {
  s3client: S3;
  constructor(
    @InjectRepository(Brand)
    protected readonly brandRepository: Repository<Brand>,
    @InjectRepository(Product)
    protected readonly productRepository: Repository<Product>,
    protected readonly configService: ConfigService,
    protected readonly hoursService: HoursService,
    protected readonly productService: ProductService,
  ) {
    const config = configService.get('storage.aws.s3');
    config.signatureVersion = 'v4'; // allow for browser upload
    this.s3client = new S3(config);
  }

  public async findWithFilter(
    searchParams: SearchParams,
  ): Promise<[Brand[], number]> {
    const {
      search,
      page,
      limit,
      order,
      shuffleBaseValue,
      publishDate,
      unpublishDate,
      includeDeleted,
    } = defaults(searchParams, DEFAULT_PARAMS);
    try {
      const TABLE_NAME = 'brand';
      const offset = page * limit;

      const query = this.brandRepository.createQueryBuilder(TABLE_NAME);
      const priorityClause = `
        CASE
          WHEN ${TABLE_NAME}.priority = ${RANDOM_PRIORITY_OPTION} THEN NULL
          ELSE ${TABLE_NAME}.priority
        END`;

      if (search) {
        const filter = '%' + search + '%';
        query.andWhere(`brand.name ILIKE :filter`, {
          filter,
        });
      }

      if (publishDate && unpublishDate) {
        query.andWhere(
          `CASE WHEN brand.publishDate IS NOT NULL AND brand.unpublishDate IS NOT NULL THEN
            brand.publishDate BETWEEN :publishDate and :unpublishDate AND
            brand.unpublishDate BETWEEN :publishDate and :unpublishDate
          ELSE
            true
          END`,
          {
            publishDate: new Date(+publishDate),
            unpublishDate: new Date(+unpublishDate),
          },
        );
      } else if (publishDate && !unpublishDate) {
        query.andWhere(
          `CASE WHEN brand.publishDate IS NOT NULL THEN
            brand.publishDate >= :publishDate
          ELSE
            true
          END`,
          { publishDate: new Date(+publishDate) },
        );
      } else if (!publishDate && unpublishDate) {
        query.andWhere(
          `CASE WHEN brand.unpublishDate IS NOT NULL THEN
            brand.unpublishDate >= :unpublishDate
          ELSE
            true
          END`,
          { unpublishDate: new Date(+unpublishDate) },
        );
      } else {
        query.andWhere(`CASE WHEN brand.publishDate IS NOT NULL AND brand.unpublishDate IS NOT NULL THEN
            current_timestamp BETWEEN brand.publishDate AND brand.unpublishDate
          ELSE
            true
          END`);
      }

      if (!includeDeleted) {
        query.andWhere('brand.deleted = false');
      }

      query.take(limit).skip(offset);

      if (order) {
        const key = Object.keys(order)[0];

        if (key === 'priority') {
          query.addSelect(priorityClause, 'priority').orderBy({
            ['priority']: {
              order: order[key],
              nulls: 'NULLS LAST',
            },
            [`${TABLE_NAME}.created`]: 'DESC',
          });
        } else {
          query.orderBy(`${TABLE_NAME}.${key}`, order[key]);
        }
      } else {
        query.addSelect(priorityClause, 'priority').orderBy('priority');
        if (shuffleBaseValue) {
          const shuffleClause = `
            CASE
              WHEN ${TABLE_NAME}.priority != ${RANDOM_PRIORITY_OPTION} THEN NULL
              ELSE (CAST(EXTRACT(EPOCH from ${TABLE_NAME}.modified) as INTEGER) + ${TABLE_NAME}.id) % ${shuffleBaseValue}
            END`;
          query.addSelect(shuffleClause, 'shuffle').addOrderBy('shuffle');
        }
        query.addOrderBy(`${TABLE_NAME}.created`, 'DESC');
      }

      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  public async createBrand(brand: Brand): Promise<Brand> {
    delete brand.id;
    try {
      return this.brandRepository.save(brand);
    } catch (error) {
      throw error;
    }
  }

  public async findById(id: number, includeDeleted?: boolean): Promise<Brand> {
    try {
      const query = this.brandRepository
        .createQueryBuilder('brand')
        .leftJoinAndSelect(
          'brand.productGroups',
          'productGroups',
          'productGroups.deleted = false',
        )
        .leftJoinAndSelect('productGroups.products', 'products')
        .leftJoinAndSelect('products.location', 'location')
        .where('brand.id = :id', { id });
      if (!includeDeleted) {
        query.andWhere('brand.deleted = false');
      }
      const result = await query.getOne();
      GDExpectedException.try(BrandExceptions.brandNotFound, result);
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async updateBrand(brand: Brand): Promise<Brand> {
    delete brand.createdBy;
    delete brand.created;
    try {
      return this.brandRepository.save(brand);
    } catch (error) {
      throw error;
    }
  }

  public async removeBrand(
    id: number,
    modifiedBy: number,
  ): Promise<UpdateResult> {
    try {
      return this.brandRepository.update({ id }, { deleted: true, modifiedBy });
    } catch (error) {
      throw error;
    }
  }

  public async createPresignedPost(
    presignDto: BrandPresignedDto,
    expiration: number = 3600,
  ): Promise<any> {
    const PHOTO_TYPE = 'image';
    const timestamp = format(new Date(), 'YYYYMMDDHHmmss');
    let fileKey = `${presignDto.brandId}_${PHOTO_TYPE}_`;
    fileKey += timestamp + path.extname(presignDto.name);
    const config = this.configService.get('storage.aws.s3');
    const endpoint = this.configService.get('storage.endpoint');
    const params = {
      Bucket: config.bucket,
      Key: 'brands/' + fileKey,
      Expires: expiration,
    };
    return {
      destinationUrl: `${endpoint}/api/brands/photo/file/${fileKey}`,
      signedUrl: this.s3client.getSignedUrl('putObject', params),
    };
  }

  public proxyFile(fileKey: string, request, response, next) {
    request.originalUrl = '/brands/' + fileKey;
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

  public async getBrandLocations(
    brandId: number,
    startFromLat?: number,
    startFromLong?: number,
  ): Promise<LocationSearchDto[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .select([
        'location.id as id',
        'location.name as name',
        'location.thumbnail as thumbnail',
        'location.description as description',
        'location.longLat as "longLat"',
        'location.timezone as timezone',
        'location.addressLine1 as "addressLine1"',
        'location.addressLine2 as "addressLine2"',
        'location.city as city',
        'location.postalCode as "postalCode"',
        'state.abbreviation as state',
        '(ROUND(AVG(rating.rating)::numeric * 2) / 2)::float as rating',
        'COUNT(DISTINCT rating.id) as "ratingCount"',
      ])
      .leftJoin('product.location', 'location', 'location.deleted = false')
      .leftJoin('location.state', 'state')
      .leftJoin('location.ratings', 'rating', 'rating.deleted = false')
      .leftJoin(
        'product.productGroup',
        'productGroup',
        'productGroup.deleted = false',
      )
      .leftJoin('productGroup.brand', 'brand')
      .where('productGroup.brand = :brandId and brand.deleted = false', {
        brandId,
      })
      .groupBy('location.id, state.id, brand.id');

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

      query
        .addSelect(distanceClause, 'distance')
        .orderBy('distance', 'ASC', 'NULLS LAST');
    }
    const locations = await query.getRawMany();

    const result = await Promise.all(
      locations.map(async location => {
        location.hours = await this.hoursService.getLocationHours(location.id);
        location.hoursToday = await this.hoursService.getHoursToday(location);
        return location;
      }),
    );
    return result;
  }

  public async getSearchCount(
    searchParams: SearchParams,
  ): Promise<SearchCountMapping> {
    const { search } = searchParams;
    if (!search) {
      return { count: 0 };
    }
    const [_, count] = await this.findWithFilter({
      search,
    });
    return { count };
  }
}
