import { S3 } from 'aws-sdk';
import { format } from 'date-fns';
import * as path from 'path';
import * as s3Proxy from 's3-proxy';
import { Repository, UpdateResult } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { CouponDay } from '../entities/coupon-day.entity';
import { CouponLimitCategory } from '../entities/coupon-limit-category.entity';
import { CouponLimit } from '../entities/coupon-limit.entity';
import { Coupon } from '../entities/coupon.entity';
import { LocationCoupon } from '../entities/location-coupon.entity';
import { CouponPhotoPresignDto } from './dto/coupon-photo-presign.dto';
import { CouponExceptions } from '../coupon/coupon.exceptions';
import { GDExpectedException } from '../gd-expected.exception';

@Injectable()
export class CouponService {
  s3client: S3;

  constructor(
    @InjectRepository(Coupon)
    protected readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponDay)
    protected readonly couponDayRepository: Repository<CouponDay>,
    @InjectRepository(LocationCoupon)
    protected readonly locationCouponRepository: Repository<LocationCoupon>,
    @InjectRepository(CouponLimit)
    protected readonly couponLimitRepository: Repository<LocationCoupon>,
    @InjectRepository(CouponLimitCategory)
    protected readonly couponLimitCategoryRepository: Repository<
      CouponLimitCategory
    >,
    protected readonly configService: ConfigService,
  ) {
    const config = configService.get('storage.aws.s3');
    config.signatureVersion = 'v4'; // allow for browser upload
    this.s3client = new S3(config);
  }

  public async getCoupons(
    search?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
    locationId?: number,
    includeExpired?: boolean,
    includeDeleted?: boolean,
    includeNotVisible: boolean = false,
  ): Promise<[Coupon[], number]> {
    const filter = search ? '%' + search + '%' : '';
    const offset = page * limit;
    try {
      const query = this.couponRepository
        .createQueryBuilder('coupon')
        .leftJoinAndSelect(
          'coupon.couponDays',
          'coupon_days',
          !includeDeleted ? 'coupon_days.deleted = false' : null,
        )
        .leftJoinAndSelect(
          'coupon.limit',
          'coupon_limit',
          !includeDeleted ? 'coupon_limit.deleted = false' : null,
        )
        .leftJoinAndSelect(
          'coupon_limit.categories',
          'coupon_limit_categories',
          !includeDeleted ? 'coupon_limit_categories.deleted = false' : null,
        )
        .leftJoin(
          'coupon.couponLocations',
          'coupon_locations',
          !includeDeleted ? 'coupon_locations.deleted = false' : null,
        )
        .where('1=1'); // placeholder where
      if (filter) {
        query.andWhere(
          '(coupon_sku ILIKE :filter OR coupon.name ILIKE :filter)',
          {
            filter,
          },
        );
      }
      if (!includeExpired) {
        query.andWhere(
          `CASE WHEN coupon.effective_date IS NOT NULL AND coupon.expiration_date IS NOT NULL THEN
            current_timestamp BETWEEN coupon.effective_date AND coupon.expiration_date
          ELSE
            1 = 1
          END`,
        );
      }
      if (!includeDeleted) {
        query.andWhere('coupon.deleted = false');
      }
      if (locationId) {
        query.andWhere('coupon_locations.location_id = :locationId', {
          locationId,
        });
      }
      if (!includeNotVisible) {
        query.andWhere('coupon.isVisible = true');
      }
      query.take(limit).skip(offset);
      if (order) {
        const key = Object.keys(order)[0];
        order['coupon.' + key] = order[key];
        delete order[key];
        query.orderBy(order);
      }
      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  public async getActiveCoupons(locationId?: number): Promise<Coupon[]> {
    try {
      const query = this.couponRepository
        .createQueryBuilder('coupon')
        .leftJoinAndSelect(
          'coupon.couponDays',
          'coupon_days',
          'coupon_days.deleted = false',
        )
        .leftJoinAndSelect(
          'coupon.couponLocations',
          'coupon_locations',
          'coupon_locations.deleted = false',
        )
        .leftJoinAndSelect(
          'coupon.limit',
          'coupon_limit',
          'coupon_limit.deleted = false',
        )
        .leftJoinAndSelect(
          'coupon_limit.categories',
          'coupon_limit_categories',
          'coupon_limit_categories.deleted = false',
        );
      const isCurrentTimeClause = `
          CASE WHEN coupon_days.start_time IS NOT NULL AND coupon_days.end_time IS NOT NULL THEN
            current_time BETWEEN coupon_days.start_time AND coupon_days.end_time
          ELSE
            1 = 1
          END
        `;
      const isCurrentDayClause = `
          CASE WHEN (SELECT COUNT(*) FROM coupon_day WHERE coupon.id = coupon_day.coupon_id AND coupon_day.deleted = false) > 0 THEN
            EXTRACT(dow from current_date) = coupon_days.day_of_week AND ${isCurrentTimeClause}
          ELSE
            1 = 1
          END
        `;
      query
        .andWhere(
          `CASE WHEN coupon.effective_date IS NOT NULL AND coupon.expiration_date IS NOT NULL THEN
            current_timestamp BETWEEN coupon.effective_date AND coupon.expiration_date
          ELSE
            1 = 1
          END`,
        )
        .andWhere(isCurrentDayClause)
        .andWhere('coupon.isAutoApply = true')
        .andWhere('coupon.deleted = false');
      if (locationId) {
        query.andWhere('coupon_locations.location_id = :locationId', {
          locationId,
        });
      }
      return query.getMany();
    } catch (error) {
      throw error;
    }
  }

  public async findCouponById(
    couponId: number,
    locationId?: number,
    includeDeleted?: boolean,
  ): Promise<Coupon> {
    try {
      const query = this.couponRepository
        .createQueryBuilder('coupon')
        .leftJoinAndSelect(
          'coupon.couponDays',
          'coupon_days',
          'coupon_days.deleted = false',
        )
        .leftJoinAndSelect(
          'coupon.couponLocations',
          'couponLocations',
          'couponLocations.deleted = false',
        )
        .leftJoinAndSelect(
          'couponLocations.location',
          'location',
          'location.deleted = false',
        )
        .leftJoinAndSelect('coupon.limit', 'coupon_limit')
        .leftJoinAndSelect(
          'coupon_limit.categories',
          'coupon_limit_categories',
          'coupon_limit_categories.deleted = false',
        )
        .where('coupon.id = :couponId', {
          couponId,
        });

      if (!includeDeleted) {
        query.andWhere('coupon.deleted = false');
      }

      if (locationId) {
        query.andWhere('couponLocations.location_id = :locationId', {
          locationId,
        });
      }

      const coupon = await query.getOne();
      /**
       * This will filter coupon locations with deleted location.
       */
      coupon.couponLocations = coupon.couponLocations.filter(
        couponLocation => couponLocation.location,
      );
      GDExpectedException.try(CouponExceptions.couponNotFound, coupon);
      return coupon;
    } catch (error) {
      throw error;
    }
  }

  public async createCoupon(coupon: Coupon): Promise<Coupon> {
    delete coupon.id;
    let result: Coupon = null;
    try {
      if (coupon.couponSku) {
        const sku = coupon.couponSku;
        const foundCouponCount = await this.couponRepository
          .createQueryBuilder()
          .where('LOWER(coupon_sku) = LOWER(:sku)', { sku })
          .getCount();
        GDExpectedException.try(
          CouponExceptions.couponSkuExists,
          foundCouponCount,
        );
      }
      result = await this.couponRepository.save(coupon);
      if (coupon.couponLocations && coupon.couponLocations.length > 0) {
        result.couponLocations = await Promise.all(
          coupon.couponLocations.map(async couponLocation => {
            couponLocation.coupon = new Coupon();
            couponLocation.coupon.id = result.id;
            couponLocation.createdBy = coupon.createdBy;
            couponLocation.modifiedBy = coupon.modifiedBy;
            return this.createLocationCoupon(couponLocation);
          }),
        );
      }
      if (coupon.couponDays && coupon.couponDays.length > 0) {
        result.couponDays = await Promise.all(
          coupon.couponDays.map(async couponDay => {
            couponDay.coupon = new Coupon();
            couponDay.coupon.id = result.id;
            couponDay.createdBy = coupon.createdBy;
            couponDay.modifiedBy = coupon.modifiedBy;
            return this.createCouponDay(couponDay);
          }),
        );
      }
      if (coupon.limit) {
        coupon.limit.coupon = new Coupon();
        coupon.limit.coupon.id = result.id;
        result.limit = await this.createCouponLimit(coupon.limit);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async updateCoupon(coupon: Coupon): Promise<Coupon> {
    let result = null;

    const couponDays = coupon.couponDays;
    const couponLocations = coupon.couponLocations;
    const couponLimit = coupon.limit;

    // delete for not updating the value
    delete coupon.couponLocations;
    delete coupon.couponDays;
    delete coupon.limit;
    delete coupon.createdBy;
    try {
      if (coupon.couponSku) {
        const sku = coupon.couponSku;
        const id = coupon.id;
        const foundCouponCount = await this.couponRepository
          .createQueryBuilder()
          .where('id != :id AND LOWER(coupon_sku) = LOWER(:sku)', {
            id,
            sku,
          })
          .getCount();
        GDExpectedException.try(
          CouponExceptions.couponSkuExists,
          foundCouponCount,
        );
      }
      result = await this.couponRepository.save(coupon);
      if (couponLocations && couponLocations.length > 0) {
        result.couponLocations = await Promise.all(
          couponLocations.map(async couponLocation => {
            couponLocation.coupon = new Coupon();
            couponLocation.coupon.id = result.id;
            couponLocation.createdBy = coupon.modifiedBy; // only if create
            couponLocation.modifiedBy = coupon.modifiedBy;
            return this.saveLocationCoupon(couponLocation);
          }),
        );
      }
      if (couponDays && couponDays.length > 0) {
        result.couponDays = await Promise.all(
          couponDays.map(async couponDay => {
            couponDay.coupon = new Coupon();
            couponDay.coupon.id = result.id;
            couponDay.createdBy = coupon.modifiedBy; // only if create
            couponDay.modifiedBy = coupon.modifiedBy;
            return this.saveCouponDay(couponDay);
          }),
        );
      }
      if (couponLimit) {
        couponLimit.coupon = new Coupon();
        couponLimit.coupon.id = result.id;
        result.limit = await this.saveCouponLimit(couponLimit);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async removeCoupon(
    id: number,
    modifiedBy: number,
  ): Promise<UpdateResult> {
    try {
      return this.couponRepository.update(
        { id },
        { deleted: true, modifiedBy },
      );
    } catch (error) {
      throw error;
    }
  }

  public async saveCouponDay(couponDay: CouponDay): Promise<CouponDay> {
    try {
      const existingCouponDay = await this.findCouponDay(
        couponDay.coupon.id,
        couponDay.dayOfWeek,
      );
      if (!existingCouponDay) {
        return this.createCouponDay(couponDay);
      } else {
        couponDay.id = existingCouponDay.id;
        return this.updateCouponDay(couponDay);
      }
    } catch (error) {
      throw error;
    }
  }

  public async findCouponDay(
    couponId: number,
    dayOfWeek: number,
  ): Promise<CouponDay> {
    try {
      return this.couponDayRepository.findOne({
        coupon: { id: couponId },
        dayOfWeek,
      });
    } catch (error) {
      throw error;
    }
  }

  public async createCouponDay(couponDay: CouponDay): Promise<CouponDay> {
    delete couponDay.id;
    try {
      return await this.couponDayRepository.save(couponDay);
    } catch (error) {
      throw error;
    }
  }

  public async updateCouponDay(couponDay: CouponDay): Promise<CouponDay> {
    delete couponDay.createdBy;
    try {
      return this.couponDayRepository.save(couponDay);
    } catch (error) {
      throw error;
    }
  }

  public async saveCouponLimit(couponLimit: CouponLimit): Promise<CouponLimit> {
    try {
      // typeorm bug: returns the first row if you supply undefined in findOne
      const couponLimitId = couponLimit.id || 0;
      const existing = await this.couponLimitRepository.findOne(couponLimitId);
      if (!existing) {
        return this.createCouponLimit(couponLimit);
      } else {
        return this.updateCouponLimit(couponLimit);
      }
    } catch (error) {
      throw error;
    }
  }

  public async createCouponLimit(
    couponLimit: CouponLimit,
  ): Promise<CouponLimit> {
    delete couponLimit.id;
    let result: CouponLimit = null;
    result = await this.couponLimitRepository.save(couponLimit);
    if (couponLimit.categories && couponLimit.categories.length) {
      couponLimit.categories = await Promise.all(
        couponLimit.categories.map(async category => {
          const categoryLimit = new CouponLimitCategory();
          categoryLimit.category = category.category;
          // use id only so it wont give circular structure
          categoryLimit.couponLimit = new CouponLimit();
          categoryLimit.couponLimit.id = result.id;
          return this.createCouponLimitCategory(categoryLimit);
        }),
      );
    }

    return result;
  }

  public async updateCouponLimit(
    couponLimit: CouponLimit,
  ): Promise<CouponLimit> {
    const couponLimitCategories = couponLimit.categories;
    delete couponLimit.created;
    delete couponLimit.categories;

    couponLimit = await this.couponLimitRepository.save(couponLimit);

    if (couponLimitCategories && couponLimitCategories.length) {
      couponLimit.categories = await Promise.all(
        couponLimitCategories.map(async category => {
          category.couponLimit = new CouponLimit();
          category.couponLimit.id = couponLimit.id;
          return this.saveCouponLimitCategory(category);
        }),
      );
    }
    return couponLimit;
  }

  public async findLocationCoupon(
    couponId: number,
    locationId: number,
  ): Promise<LocationCoupon> {
    try {
      return this.locationCouponRepository.findOne({
        coupon: { id: couponId },
        location: { id: locationId },
      });
    } catch (error) {
      throw error;
    }
  }

  public async saveLocationCoupon(
    locationCoupon: LocationCoupon,
  ): Promise<LocationCoupon> {
    try {
      const existingLocationCoupon = await this.findLocationCoupon(
        locationCoupon.coupon.id,
        locationCoupon.location.id,
      );
      if (!existingLocationCoupon) {
        return this.createLocationCoupon(locationCoupon);
      } else {
        locationCoupon.id = existingLocationCoupon.id;
        return this.updateLocationCoupon(locationCoupon);
      }
    } catch (error) {
      throw error;
    }
  }

  public async createLocationCoupon(
    locationCoupon: LocationCoupon,
  ): Promise<LocationCoupon> {
    delete locationCoupon.id;
    try {
      return this.locationCouponRepository.save(locationCoupon);
    } catch (error) {
      throw error;
    }
  }

  public async updateLocationCoupon(
    locationCoupon: LocationCoupon,
  ): Promise<LocationCoupon> {
    delete locationCoupon.createdBy;
    try {
      return this.locationCouponRepository.save(locationCoupon);
    } catch (error) {
      throw error;
    }
  }

  public async findCouponLimitCategory(
    couponLimitId,
    category: string,
  ): Promise<CouponLimitCategory> {
    try {
      return this.couponLimitCategoryRepository.findOne({
        couponLimit: { id: couponLimitId },
        category,
      });
    } catch (error) {
      throw error;
    }
  }

  public async saveCouponLimitCategory(
    couponLimitCategory: CouponLimitCategory,
  ): Promise<CouponLimitCategory> {
    try {
      const existingData = await this.findCouponLimitCategory(
        couponLimitCategory.couponLimit.id,
        couponLimitCategory.category,
      );
      if (!existingData) {
        return this.createCouponLimitCategory(couponLimitCategory);
      } else {
        couponLimitCategory.id = existingData.id;
        return this.updateCouponLimitCategory(couponLimitCategory);
      }
    } catch (error) {
      throw error;
    }
  }

  public async createCouponLimitCategory(
    couponLimitCategory: CouponLimitCategory,
  ): Promise<CouponLimitCategory> {
    delete couponLimitCategory.id;
    try {
      return this.couponLimitCategoryRepository.save(couponLimitCategory);
    } catch (error) {
      throw error;
    }
  }

  public async updateCouponLimitCategory(
    couponLimitCategory: CouponLimitCategory,
  ): Promise<CouponLimitCategory> {
    delete couponLimitCategory.createdBy;
    try {
      return this.couponLimitCategoryRepository.save(couponLimitCategory);
    } catch (error) {
      throw error;
    }
  }

  public async createPresignedPost(
    presignDto: CouponPhotoPresignDto,
    expiration: number = 3600,
  ): Promise<any> {
    const PHOTO_TYPE = 'image';
    const timestamp = format(new Date(), 'YYYYMMDDHHmmss');
    let fileKey = `${presignDto.couponId}_${PHOTO_TYPE}_`;
    fileKey += timestamp + path.extname(presignDto.name);
    const config = this.configService.get('storage.aws.s3');
    const endpoint = this.configService.get('storage.endpoint');
    const params = {
      Bucket: config.bucket,
      Key: 'coupons/' + fileKey,
      Expires: expiration,
    };
    return {
      destinationUrl: `${endpoint}/api/coupons/photo/file/${fileKey}`,
      signedUrl: this.s3client.getSignedUrl('putObject', params),
    };
  }

  public proxyFile(fileKey: string, request, response, next) {
    request.originalUrl = '/coupons/' + fileKey;
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

  public async findCouponByCouponSku(
    locationId: number,
    couponSku: string,
  ): Promise<Coupon> {
    try {
      if (!couponSku) {
        GDExpectedException.throw(CouponExceptions.couponInvalid);
      }
      return this.couponRepository
        .createQueryBuilder('coupon')
        .leftJoin(
          'coupon.couponLocations',
          'coupon_locations',
          'coupon_locations.deleted = false',
        )
        .where('LOWER(coupon.coupon_sku) = LOWER(:couponSku)', { couponSku })
        .andWhere('coupon.deleted = false')
        .andWhere('coupon_locations.location_id = :locationId', {
          locationId,
        })
        .getOne();
    } catch (error) {
      throw error;
    }
  }
}
