import { S3 } from 'aws-sdk';
import { format } from 'date-fns';
import * as path from 'path';
import * as s3Proxy from 's3-proxy';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { PromoBanner } from '../entities/promo-banner.entity';
import { PromoBannerDto, RANDOM_SEQUENCE_OPTION } from './promo-banner.dto';
import { PromoBannerPhotoPresignDto } from './promo-banner-photo-presign.dto';

@Injectable()
export class PromoBannerService {
  s3client: S3;
  config;

  constructor(
    @InjectRepository(PromoBanner)
    protected promoBannerRepository: Repository<PromoBanner>,
    protected readonly configService: ConfigService,
  ) {
    this.config = configService.get('storage.aws.s3');
    this.config.signatureVersion = 'v4'; // allow for browser upload
    this.s3client = new S3(this.config);
  }

  public async findWithFilter(
    search: string = '',
    page: number = 0,
    limit: number = 100,
    order: string = '',
    includeInactive: boolean = false,
  ): Promise<[PromoBanner[], number]> {
    try {
      const tableName = 'promoBanner';
      const offset = page * limit;

      const query = this.promoBannerRepository.createQueryBuilder(tableName);
      const sequenceClause = `
        CASE
          WHEN ${tableName}.sequenceNumber = ${RANDOM_SEQUENCE_OPTION} THEN NULL
          ELSE ${tableName}.sequenceNumber
        END`;

      if (search) {
        const filter = '%' + search + '%';
        query.where('name ILIKE :filter', { filter });
      }
      if (!includeInactive) {
        query.andWhere(`${tableName}.isActive = true`);
      }
      if (order) {
        const key = Object.keys(order)[0];
        if (key === 'sequenceNumber') {
          query.addSelect(sequenceClause, 'sequence');
          order[`${tableName}.isActive`] = 'DESC';
          order[`sequence`] = {
            order: order[key],
            nulls: 'NULLS LAST',
          };
        } else {
          order[`${tableName}.${key}`] = order[key];
        }
        delete order[key];
        query.orderBy(order);
      } else {
        query.addSelect(sequenceClause, 'sequence');
        query.orderBy({
          [`${tableName}.isActive`]: 'DESC',
          [`sequence`]: 'ASC',
          [`${tableName}.id`]: 'DESC',
        });
      }

      query.limit(limit).offset(offset);
      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  public async findById(id: number): Promise<PromoBanner> {
    try {
      return this.promoBannerRepository.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  public async create(promoBanner: PromoBanner): Promise<PromoBanner> {
    try {
      return this.promoBannerRepository.save(promoBanner);
    } catch (error) {
      throw error;
    }
  }

  public async update(promoBannerDto: PromoBannerDto): Promise<PromoBanner> {
    try {
      return this.promoBannerRepository.save(promoBannerDto);
    } catch (error) {
      throw error;
    }
  }

  public async createPresignedPost(
    presignDto: PromoBannerPhotoPresignDto,
    expiration: number = 3600,
  ): Promise<any> {
    const timestamp = format(new Date(), 'YYYYMMDDHHmmss');
    let fileKey = `${presignDto.bannerId}_${presignDto.type}_`;
    fileKey += timestamp + path.extname(presignDto.name);
    const endpoint = this.configService.get('storage.endpoint');
    const params = {
      Bucket: this.config.bucket,
      Key: 'promo-banner/' + fileKey,
      Expires: expiration,
    };
    return {
      destinationUrl: `${endpoint}/api/promo-banner/photo/file/${fileKey}`,
      signedUrl: this.s3client.getSignedUrl('putObject', params),
    };
  }

  public proxyFile(fileKey: string, request, response, next) {
    request.originalUrl = '/promo-banner/' + fileKey;
    s3Proxy(this.config)(request, response, error => {
      if (error && error.status === 404) {
        response.type('json');
        return next(new NotFoundException());
      }
      next(error);
    });
  }
}
