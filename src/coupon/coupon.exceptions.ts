import { HttpStatus } from '@nestjs/common';
import { ExpectedExceptionMap } from '../app.interface';
import { Coupon } from '../entities/coupon.entity';

export const CouponExceptions: ExpectedExceptionMap = {
  couponNotFound: {
    message: 'Error: Coupon not found',
    httpStatus: HttpStatus.NOT_FOUND,
    i18n: { 'es-PR': 'Error: no se encontró el cupón' },
    failCondition: (coupon: Coupon) => !coupon || !coupon.id,
  },
  couponInvalid: {
    message: 'Error: Invalid coupon',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: { 'es-PR': 'Error: Cupón inválido.' },
  },
  couponNotApplyWithOther: {
    message: 'Error: Cannot be applied with other coupons',
    httpStatus: HttpStatus.CONFLICT,
    i18n: { 'es-PR': 'Error: No se puede aplicar con otros cupones.' },
  },
  couponSkuExists: {
    message: 'Error: this Coupon SKU/Code already exists in another coupon.',
    httpStatus: HttpStatus.CONFLICT,
    failCondition: foundCouponCount => foundCouponCount > 0,
  },
};
