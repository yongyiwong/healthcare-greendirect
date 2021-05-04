import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { CouponService } from './coupon.service';
import { LocationService } from './../location/location.service';
import { UserService } from '../user/user.service';

import {
  Coupon,
  DiscountType,
  DiscountApplication,
} from './../entities/coupon.entity';
import { CouponDay } from './../entities/coupon-day.entity';
import { LocationCoupon } from './../entities/location-coupon.entity';

describe('CouponController', () => {
  let couponService: CouponService;
  let locationService: LocationService;
  let userService: UserService;
  let couponSKU: string;
  let locationId: number;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    couponService = module.get<CouponService>(CouponService);
    locationService = module.get<LocationService>(LocationService);
    userService = module.get<UserService>(UserService);
  });

  describe('Coupon Unit Tests', () => {
    let admin;
    beforeAll(async () => {
      // Admin Role
      admin = await userService.findByEmail('admin_e2e@isbx.com');
    });

    it('should create coupon', async () => {
      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const couponLocations = [
        {
          location: location[0][0],
        },
      ] as LocationCoupon[];

      locationId = location[0][0].id;
      const couponDay = [
        {
          dayOfWeek: 0,
          startTime: '00:00:00',
          endTime: '12:00:00',
        },
      ] as CouponDay[];
      const limitCategories = [{ category: 'Some Category' }];
      const couponLimit = {
        categories: limitCategories,
      };
      const ts = +new Date(); // force milliseconds
      couponSKU = `test${+new Date()}`;
      const coupon = {
        name: `Coupon${ts}`,
        couponLocations,
        couponDays: couponDay,
        effectiveDate: new Date(),
        expirationDate: new Date(),
        discountType: DiscountType.Fixed,
        discountApplication: DiscountApplication.SingleLineItem,
        discountAmount: 10.0,
        couponSku: couponSKU,
        limit: couponLimit,
      } as Coupon;
      const result = await couponService.createCoupon(coupon);
      expect(result.id).toBeTruthy();
      expect(result.effectiveDate).toBe(coupon.effectiveDate);
      expect(result.expirationDate).toBe(coupon.expirationDate);
      expect(result.couponLocations.length).toBe(1);
      result.couponLocations.forEach(data => {
        expect(data.id).toBeTruthy();
      });
      expect(result.couponDays.length).toBe(1);
      result.couponDays.forEach(data => {
        expect(data.id).toBeTruthy();
      });
      expect(result.limit).toBeDefined();
      result.limit.categories.forEach(data => {
        expect(data.id).toBeTruthy();
      });
    });

    it('should get all coupons', async () => {
      const result = await couponService.getCoupons();
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toBeInstanceOf(Array);
      expect(result[0].length).toBeGreaterThan(0);
    });

    it('should get coupon by id', async () => {
      const coupons = await couponService.getCoupons();
      const result = await couponService.findCouponById(coupons[0][0].id);
      expect(result.id).toBe(coupons[0][0].id);
    });

    it('should update coupon', async () => {
      const coupons = await couponService.getCoupons();

      const ts = +new Date(); // force milliseconds
      const updateCoupon = coupons[0][0];
      updateCoupon.name = `Coupon${ts}`; // update value

      const result = await couponService.updateCoupon(updateCoupon);
      expect(result.id).toBe(coupons[0][0].id);
      expect(result.name).toBe(updateCoupon.name);
    });

    it('should find coupon by coupon SKU', async () => {
      const coupon = await couponService.findCouponByCouponSku(
        locationId,
        couponSKU,
      );
      expect(coupon).toBeTruthy();
      expect(coupon.deleted).toBeFalsy();
      expect(coupon.couponSku).toBe(couponSKU);
    });

    it('should removed coupon', async () => {
      const coupons = await couponService.getCoupons();
      expect(coupons[0][0].deleted).toBe(false);

      const coupon = await couponService.findCouponById(coupons[0][0].id);
      expect(coupon).toBeTruthy(); // should return coupon

      await couponService.removeCoupon(coupon.id, admin.id);

      const result = await couponService.findCouponById(
        coupons[0][0].id,
        null,
        true,
      );
      expect(result.deleted).toBeTruthy();
    });
  });

  describe('Expected Exceptions', () => {
    // TODO
  });
});
