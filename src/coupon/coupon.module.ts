import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponDay } from '../entities/coupon-day.entity';
import { Coupon } from '../entities/coupon.entity';
import { LocationCoupon } from '../entities/location-coupon.entity';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { CouponLimit } from '../entities/coupon-limit.entity';
import { CouponLimitCategory } from '../entities/coupon-limit-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coupon,
      CouponDay,
      LocationCoupon,
      CouponLimit,
      CouponLimitCategory,
    ]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
