import { S3 } from 'aws-sdk';
import { format } from 'date-fns';
import * as path from 'path';
import * as s3Proxy from 's3-proxy';
import { Repository, UpdateResult } from 'typeorm';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { Doctor } from '../entities/doctor.entity';
import { SRID } from '../location';
import { DoctorExceptions } from './doctor.exceptions';
import { DoctorPhotoPresignDto } from './dto/doctor-photo-presign.dto';
import { DoctorSearchDto } from './dto/doctor-search.dto';
import { GDExpectedException } from '../gd-expected.exception';
import {
  SearchParams,
  DEFAULT_PARAMS,
} from '../common/search-params.interface';
import { SearchCountMapping } from '../common/search-count.dto';
import { defaults } from 'lodash';

@Injectable()
export class DoctorService {
  s3client: S3;

  private readonly doctorSelectColumns = [
    'doctor.id as id',
    'doctor.name as name',
    'doctor.thumbnail as thumbnail',
    'doctor.website as website',
    'doctor.email as email',
    'doctor.longLat as "longLat"',
    'doctor.addressLine1 as "addressLine1"',
    'doctor.addressLine2 as "addressLine2"',
    'doctor.city as city',
    'doctor.postalCode as "postalCode"',
    'doctor.phoneNumber as "phoneNumber"',
    'doctor.priority as "priority"',
    'doctor.modified as "modified"',
  ];
  private readonly doctorComputedColumns = [
    'state.id as "stateId"',
    'state.abbreviation as state',
  ];

  constructor(
    @InjectRepository(Doctor)
    protected readonly doctorRepository: Repository<Doctor>,
    protected readonly configService: ConfigService,
  ) {
    const config = configService.get('storage.aws.s3');
    config.signatureVersion = 'v4'; // allow for browser upload
    this.s3client = new S3(config);
  }

  public async findWithFilter(
    searchParams: SearchParams,
  ): Promise<[DoctorSearchDto[], number]> {
    const {
      search,
      minLat,
      minLong,
      maxLat,
      maxLong,
      page,
      limit,
      order,
      startFromLat,
      startFromLong,
    } = defaults(searchParams, DEFAULT_PARAMS);

    let rawMany: DoctorSearchDto[] = [];
    let count = 0;
    try {
      const filter = '%' + (search || '') + '%';
      const offset = page * limit;
      const query = this.doctorRepository
        .createQueryBuilder('doctor')
        .select(this.doctorSelectColumns)
        .addSelect(this.doctorComputedColumns)
        .where(
          `doctor.deleted = false AND (
        doctor.name ILIKE :filter OR
        doctor.city ILIKE :filter OR
        doctor.addressLine1 ILIKE :filter OR
        doctor.addressLine2 ILIKE :filter )`,
          { filter },
        )
        .leftJoin('doctor.state', 'state');

      let distanceClause = 'NULL';
      if (startFromLat || startFromLong) {
        // starting coordinates detected, let's sort by nearest distance
        GDExpectedException.try(DoctorExceptions.invalidStartingLatLong, {
          startFromLat,
          startFromLong,
        });
        distanceClause = `
        CASE WHEN long_lat IS NULL THEN NULL ELSE (
          ST_DistanceSphere(
            ST_SetSrid(ST_MakePoint(long_lat[0], long_lat[1]), ${SRID}),
            ST_SetSrid(ST_MakePoint(${startFromLong}, ${startFromLat}), ${SRID})
          ) / 1000.0)
        END`;
      }
      query.addSelect(distanceClause, 'distance');

      if (minLat && minLong && maxLat && maxLong) {
        query.andWhere(
          'ST_MakePoint(long_lat[0], long_lat[1], :SRID) && ST_MakeEnvelope(:minLong, :minLat, :maxLong, :maxLat, :SRID)',
          { minLong, minLat, maxLong, maxLat, SRID },
        );
      }
      count = await query.getCount();

      query.limit(limit).offset(offset);
      if (order) {
        const key = Object.keys(order)[0];
        order['doctor.' + key] = order[key];
        delete order[key];
        query.orderBy(order);
      } else {
        query.orderBy({
          priority: 'ASC',
          distance: {
            order: 'ASC',
            nulls: 'NULLS LAST',
          },
          id: 'ASC',
        });
      }
      rawMany = await query.getRawMany();
    } catch (error) {
      throw error;
    }
    return [rawMany, count];
  }

  public async findById(id: number): Promise<Doctor> {
    if (!id) throw new BadRequestException('id not provided');
    return this.doctorRepository.findOne(id);
  }

  public async create(doctor: Doctor): Promise<Doctor> {
    delete doctor.id;
    return this.doctorRepository.save(doctor);
  }

  public async update(doctor: Doctor): Promise<Doctor> {
    delete doctor.createdBy;
    return this.doctorRepository.save(doctor);
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

  public async remove(id: number, modifiedBy: number): Promise<UpdateResult> {
    return this.doctorRepository.update({ id }, { deleted: true, modifiedBy });
  }

  public async createPresignedPost(
    presignDto: DoctorPhotoPresignDto,
    expiration: number = 3600,
  ): Promise<any> {
    const PHOTO_TYPE = 'thumbnail';
    const timestamp = format(new Date(), 'YYYYMMDDHHmmss');
    let fileKey = `${presignDto.doctorId}_${PHOTO_TYPE}_`;
    fileKey += timestamp + path.extname(presignDto.name);
    const config = this.configService.get('storage.aws.s3');
    const endpoint = this.configService.get('storage.endpoint');
    const params = {
      Bucket: config.bucket,
      Key: 'doctors/' + fileKey,
      Expires: expiration,
    };
    return {
      destinationUrl: `${endpoint}/api/doctors/photo/file/${fileKey}`,
      signedUrl: this.s3client.getSignedUrl('putObject', params),
    };
  }

  public proxyFile(fileKey: string, request, response, next) {
    request.originalUrl = '/doctors/' + fileKey;
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
