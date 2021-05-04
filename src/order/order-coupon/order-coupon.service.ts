import * as _ from 'lodash';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Repository, UpdateResult, FindManyOptions, Not, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GDExpectedException } from '../../gd-expected.exception';

import { OrderCoupon } from '../../entities/order-coupon.entity';
import { OrderService } from './../order.service';

import { CouponService } from '../../coupon/coupon.service';
import { CouponExceptions } from '../../coupon/coupon.exceptions';
import { FulfillmentMethod, OrderStatus } from './../order-status.enum';
import { Order } from '../../entities/order.entity';
import { Coupon } from '../../entities/coupon.entity';
import { User } from '../../entities/user.entity';
import { LocationCoupon } from '../../entities/location-coupon.entity';

// TODO refactor as private functions? or export for unit testing?
/** Extract OrderCoupons that are still applied and not deleted. */
export const getAppliedCoupons = (orderCoupons: OrderCoupon[]) =>
  orderCoupons.filter(({ applied, deleted }) => applied && !deleted);

export const hasUserUsedCoupon = (
  userOrderCoupons: OrderCoupon[],
  couponId: number,
) =>
  !_.isEmpty(
    getAppliedCoupons(userOrderCoupons).filter(
      ({ coupon }) => couponId === coupon.id,
    ),
  );

export const getEquivalentLocationCoupon = (
  locationCoupons: Coupon[],
  orderCoupon: OrderCoupon,
): Coupon => {
  const { coupon } = orderCoupon;
  return locationCoupons.find(({ id }) => id === coupon.id);
};

export const isCouponActiveInLocation = (
  couponLocations: LocationCoupon[],
  locationId: number,
) => {
  return !!couponLocations.find(
    couponLocation => couponLocation.locationId === locationId,
  );
};

export const canApplyWithOthers = (
  orderCoupons: OrderCoupon[],
  orderCouponId = 0,
) => {
  return _.isEmpty(
    getAppliedCoupons(orderCoupons).filter(({ id }) => id !== orderCouponId),
  );
 }
@Injectable()
export class OrderCouponService {
  constructor(
    @InjectRepository(OrderCoupon)
    private readonly orderCouponRepository: Repository<OrderCoupon>,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    private readonly couponService: CouponService,
  ) {}

  public async refreshOrderCoupons(order: Order) {
    const { user, location } = order;
    // Do all promise resolutions ahead of computation to avoid promises inside loops

    // All Order Coupons used by the current user
    const userOrderCouponsHistory: OrderCoupon[] = await this.getUserOrderCouponsHistory(
      user,
    );

    // All coupons offered by location
    const allActiveCoupons = await this.couponService.getActiveCoupons(
      location.id,
    );

    // Get all order coupons, applied or not applied.
    // Use for rechecking if order coupon will be reapplied.
    // Do not use order.coupons (which are only the applied ones)
    const orderCoupons = await this.getOrderCoupons(order.id);

    // Recheck (update/delete) existing cart orderCoupons against latest coupons
    const recheckedCartCoupons = this.recheckExistingOrderCoupons(
      orderCoupons,
      order,
      allActiveCoupons,
    );

    // From those new location coupons that are not in the (updated) cart, create new OrderCoupons
    const newOrderCoupons = allActiveCoupons
      .filter(
        ({ id }) =>
          !getAppliedCoupons(recheckedCartCoupons).find(
            ({ coupon }) => coupon.id === id,
          ),
      )
      .map(coupon => ({ ...new OrderCoupon(), coupon, order, applied: true }));

    // Merge the final unique coupons that we have for saving, then
    // Check their remaining coupon flags
    const finalCoupons = this.applyCouponFlags(
      [...newOrderCoupons, ...recheckedCartCoupons],
      order,
      userOrderCouponsHistory,
    );

    // Save all updates (deleted, applied, new OrderCoupons) to db
    return this.saveOrderCoupons(finalCoupons);
  }

  public async getOrderCoupons(orderId: number): Promise<OrderCoupon[]> {
    try {
      return this.orderCouponRepository
        .createQueryBuilder('orderCoupon')
        .leftJoinAndSelect('orderCoupon.coupon', 'coupon')
        .leftJoinAndSelect(
          'coupon.couponLocations',
          'couponLocations',
          'couponLocations.deleted = false',
        )
        .where('orderCoupon.order = :orderId', { orderId })
        .andWhere('orderCoupon.deleted = false')
        .getMany();
    } catch (error) {
      throw error;
    }
  }

  public recheckExistingOrderCoupons(
    orderCoupons: OrderCoupon[],
    order: Order,
    locationApplicableCoupons: Coupon[],
  ): OrderCoupon[] {
    // Synchronize the order coupons with the fresh location coupons
    return orderCoupons.map(orderCoupon => {
      const { coupon } = orderCoupon;
      const { isAutoApply, deleted, couponLocations } = coupon;

      const matchingLocationCoupon = getEquivalentLocationCoupon(
        locationApplicableCoupons,
        orderCoupon,
      );
      // Check if coupon is still applicable in this order's location

      // OrderCoupon is no longer applicable: DELETE it
      if (!matchingLocationCoupon) {
        // However, retain if manually-added for further checking
        orderCoupon.deleted = isAutoApply
          ? true
          : !isCouponActiveInLocation(couponLocations, order.location.id) ||
            deleted;
      } else {
        // Coupon still offered by location, APPLY it to the order if orderCoupon is undeleted.
        orderCoupon.applied = true;
        // Do the rest of the checks in next function
      }
      return orderCoupon;
    });
  }

  /**
   * Used to implement the flags on the final list of order coupons
   * @param newOrderCoupons - all final coupons that are applicable to order/cart
   * @param order
   * @param userOrderCouponsHistory
   */
  public applyCouponFlags(
    newOrderCoupons: OrderCoupon[],
    order: Order,
    userOrderCouponsHistory: OrderCoupon[],
  ): OrderCoupon[] {
    // Note: applyWithOther and autoApply can be considered as flags for `deleted`, not `applied`.
    // So they are used for filtering instead
    return newOrderCoupons.reduce(
      (applicableCoupons: OrderCoupon[], orderCoupon: OrderCoupon) => {
        const { coupon, deleted } = orderCoupon;
        const {
          isAutoApply,
          applyWithOther,
          isOneTimeUse,
          isForDelivery,
          isForPickup,
        } = coupon;

        //  Existing Coupons - Applicable to Cart rules
        //  Do the rest of the checking for the remaining applicable coupon flags
        orderCoupon.applied =
          !deleted &&
          (isOneTimeUse
            ? !hasUserUsedCoupon(userOrderCouponsHistory, coupon.id)
            : true) &&
          (FulfillmentMethod.PICKUP === order.fullfillmentMethod
            ? isForPickup
            : true) &&
          (FulfillmentMethod.DELIVERY === order.fullfillmentMethod
            ? isForDelivery
            : true) &&
          (!isAutoApply && !applyWithOther
            ? canApplyWithOthers(applicableCoupons, orderCoupon.id)
            : true);

        applicableCoupons.push(orderCoupon);
        return applicableCoupons;
      },
      [],
    );
  }

  public async deleteCoupon(
    orderId: number,
    couponId: number,
    userId: number,
  ): Promise<UpdateResult> {
    try {
      const result = await this.orderCouponRepository
        .createQueryBuilder()
        .update(OrderCoupon)
        .set({ deleted: true, applied: false, modifiedBy: userId })
        .where('order_id = :orderId', { orderId })
        .andWhere('coupon_id = :couponId', { couponId })
        .execute();
      await this.orderService.refreshSaveOrderTotals(orderId, userId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async addCoupon(
    orderId: number,
    couponSku: string,
    userId: number,
  ): Promise<OrderCoupon> {
    try {
      const order = await this.orderService.getOrder(orderId, userId);
      const coupon = await this.couponService.findCouponByCouponSku(
        order.location.id,
        couponSku,
      );
      // If coupon not exist
      if (!coupon) {
        throw new GDExpectedException(CouponExceptions.couponInvalid);
      }
      const isManualAlreadyExist = getAppliedCoupons(order.coupons).find(
        orderCoupon => !orderCoupon.coupon.isAutoApply,
      );
      // If coupon already exist in cart
      if (isManualAlreadyExist) {
        throw new GDExpectedException(CouponExceptions.couponInvalid);
      }
      // If coupon already applied
      if (coupon.isOneTimeUse) {
        const isFound = await this.isOrderCouponUsed(coupon.id, userId);
        if (isFound)
          throw new GDExpectedException(CouponExceptions.couponInvalid);
      }
      // If coupon will be applied automatically
      if (coupon.isAutoApply) {
        throw new GDExpectedException(CouponExceptions.couponInvalid);
      }
      // If coupon only for delivery
      if (
        !coupon.isForDelivery &&
        order.fullfillmentMethod === FulfillmentMethod.DELIVERY
      ) {
        throw new GDExpectedException(CouponExceptions.couponInvalid);
      }
      // If coupon only for pickup
      if (
        !coupon.isForPickup &&
        order.fullfillmentMethod === FulfillmentMethod.PICKUP
      ) {
        throw new GDExpectedException(CouponExceptions.couponInvalid);
      }
      // If coupon can be applied with others
      if (!coupon.applyWithOther) {
        // Check if has coupon
        const existData = order.coupons.find(
          orderCoupon => orderCoupon.applied,
        );
        if (existData)
          throw new GDExpectedException(
            CouponExceptions.couponNotApplyWithOther,
          );
      }
      const existingData = await this.findOrderCoupon(order.id, coupon.id);
      let orderCoupon = new OrderCoupon();
      // update only if exist
      if (existingData) {
        orderCoupon = existingData;
        orderCoupon.applied = true;
        orderCoupon.deleted = false;
        delete existingData.created;
      } else {
        orderCoupon.order = order;
        orderCoupon.coupon = coupon;
        orderCoupon.modifiedBy = userId;
        orderCoupon.createdBy = userId;
      }
      const result = await this.orderCouponRepository.save(orderCoupon);
      await this.orderService.refreshSaveOrderTotals(order.id, userId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async findOrderCoupon(
    orderId: number,
    couponId: number,
  ): Promise<OrderCoupon> {
    try {
      return this.orderCouponRepository.findOne({
        where: { order: { id: orderId }, coupon: { id: couponId } },
      });
    } catch (error) {
      throw error;
    }
  }

  public async isOrderCouponUsed(
    couponId: number,
    userId: number,
  ): Promise<boolean> {
    try {
      const query = this.orderCouponRepository
      .createQueryBuilder('order_coupon')
      .leftJoin('order_coupon.order', 'order')
      .leftJoin('order.user', 'user')
      .where('order_coupon.coupon_id = :couponId', {
        couponId,
      })
      .andWhere('order.orderStatus NOT IN (:closed, :cancelled)', {
        closed: OrderStatus.CLOSED,
        cancelled: OrderStatus.CANCELLED,
      })
      .andWhere('user.id = :userId', {
        userId,
      })
      .andWhere('order_coupon.deleted = false')
      .andWhere('order_coupon.applied = true');
      const result = await this.orderCouponRepository
        .createQueryBuilder('order_coupon')
        .leftJoin('order_coupon.order', 'order')
        .leftJoin('order.user', 'user')
        .where('order_coupon.coupon_id = :couponId', {
          couponId,
        })
        .andWhere('order.orderStatus NOT IN (:closed, :cancelled)', {
          closed: OrderStatus.CLOSED,
          cancelled: OrderStatus.CANCELLED,
        })
        .andWhere('user.id = :userId', {
          userId,
        })
        .andWhere('order_coupon.deleted = false')
        .andWhere('order_coupon.applied = true')
        .getMany();

      return !_.isEmpty(result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get an array of all coupons used by a user in his past orders.
   * @param user
   * @param couponId - optional - specify a coupon id to retrieve an array containing only that orderCoupon.
   */
  public async getUserOrderCouponsHistory(
    user: User,
    couponId: number = 0,
  ): Promise<OrderCoupon[]> {
    const { OPEN, CLOSED, CANCELLED } = OrderStatus;
    try {
      const query = this.orderCouponRepository
        .createQueryBuilder('order_coupon')
        .leftJoinAndSelect('order_coupon.coupon', 'coupon')
        .leftJoinAndSelect('order_coupon.order', 'order')
        .leftJoin('order.user', 'user')
        .andWhere('order.orderStatus NOT IN (:open, :closed, :cancelled)', {
          open: OPEN,
          closed: CLOSED,
          cancelled: CANCELLED,
        })
        .andWhere('user.id = :userId', {
          userId: user.id,
        })
        .andWhere('order_coupon.deleted = false')
        .andWhere('order_coupon.applied = true');
      if (couponId) {
        query.andWhere('order_coupon.coupon_id = :couponId', { couponId });
      }
      return query.getMany();
    } catch (error) {
      throw error;
    }
  }

  public async saveOrderCoupons(orderCoupons: OrderCoupon[]) {
    try {
      return this.orderCouponRepository.save(orderCoupons);
    } catch (error) {
      throw error;
    }
  }
}
