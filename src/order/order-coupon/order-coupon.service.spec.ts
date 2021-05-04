import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import {
  getAppliedCoupons,
  hasUserUsedCoupon,
  getEquivalentLocationCoupon,
  isCouponActiveInLocation,
  canApplyWithOthers,
  OrderCouponService,
} from './order-coupon.service';
import { FulfillmentMethod, OrderStatus } from './../order-status.enum';
import { OrderCoupon } from '../../entities/order-coupon.entity';
import { UserService } from '../../user/user.service';
import { ProductService } from '../../product/product.service';
import { LocationService } from '../../location/location.service';
import { CouponService } from '../../coupon/coupon.service';
import { OrderService } from '../../order/order.service';
import { CouponExceptions } from '../../coupon/coupon.exceptions';
import { FixtureService } from '../../../test/utils/fixture.service';
import { TestUtilsModule } from '../../../test/utils/test-utils.module';
import { Location } from '../../entities/location.entity';
import { Organization } from '../../entities/organization.entity';
import { def, get } from 'bdd-lazy-var';
import { Product } from '../../entities/product.entity';
import { LocationCoupon } from '../../entities/location-coupon.entity';
import { Coupon } from '../../entities/coupon.entity';
import { Order } from '../../entities/order.entity';
import { CouponMock } from '../../../test/mocks/coupon.mock';

describe('Order Coupon Service', () => {
  let userService: UserService;
  let productService: ProductService;
  let locationService: LocationService;
  let orderService: OrderService;
  let couponService: CouponService;
  let orderCouponService: OrderCouponService;
  let fixtureService: FixtureService;
  let PRODUCT:Product;
  let module:TestingModule;

  const LOCATION = 'location';
  const ORGANIZATION = 'organization';
  const COUPON = 'coupon';
  const ORDER = 'order';
  const USER = 'user';
  
  beforeAll(async () => {
    jest.setTimeout(10000);    
    module = await Test.createTestingModule({
      imports: [AppModule, TestUtilsModule],
    }).compile();

    fixtureService = module.get<FixtureService>(FixtureService);
    userService = module.get<UserService>(UserService);
    productService = module.get<ProductService>(ProductService);
    locationService = module.get<LocationService>(LocationService);
    orderService = module.get<OrderService>(OrderService);
    couponService = module.get<CouponService>(CouponService);
    orderCouponService = module.get<OrderCouponService>(OrderCouponService);
  });

  let user, product, location, order:Order;

  //coupons[0] : used for common
  //coupons[1] : used for add order coupon
  //coupons[2] : used for checking Manual coupon
  //coupons[3] : used for delete 
  let coupons:Coupon[];

  describe('Order Coupon Unit Tests', () => {

    // These definitions insert new records with random values.
    def(USER, async () => {
      user = await userService.findByEmail('user+e2e@isbx.com');
      return user;
    });

    def(ORGANIZATION, async () => {
      const organization = fixtureService.saveEntityUsingValues(Organization);
      return organization;
    });

    def(LOCATION, async ():Promise<Location> => {
      const locations = await locationService.findWithFilter({
        search: 'ISBX',
      });
      location = locations[0][0];
      const products = await productService.findWithFilter({
        locationId: location.id,
        search: 'Product 1',
      });
      product = products[0][0];      
      return location;
    });

    def( COUPON, async() => {
      let error;
      try {
        coupons = [];
        const couponMock = new CouponMock(module);
        const userId = user?user.id:(await get(USER)).id;
        const location = await get(LOCATION);

        coupons.push(await couponMock.randomGenerate( userId, location ));
        coupons.push(await couponMock.randomGenerate( userId, location ));
        coupons.push(await couponMock.randomGenerate( userId, location ));
        coupons.push(await couponMock.randomGenerate( userId, location ));
        return coupons;
      } catch (err) {
        error = err;
        console.error('ERROR', err);
      }
    });

    def( ORDER, async() => {
      const order = await orderService.create({
        ...new Order(),
        user: user?user:await get(USER),
        location: location.id,
      });
      return order;
    })

    beforeAll(async() => {
      user = await get(USER);
      location = await get(LOCATION);
      const couponLocations = [
        {
          location: location,
        },
      ] as LocationCoupon[];      
      order = await get( ORDER );
      await get( COUPON );
    });

    it('Test getAppliedCoupons()', async () => {
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      const orderCoupon:OrderCoupon = await orderCouponService.addCoupon( order.id, coupons[0].couponSku, user.id );
      expect(orderCoupon).toBeTruthy();

      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const result = getAppliedCoupons(cart.coupons);
      result.forEach(orderCoupon => {
        expect(orderCoupon.applied).toBeTruthy();
        expect(orderCoupon.deleted).toBeFalsy();
      });
    });

    it('Test hasUserUsedCoupon()', async () => {
      // Remove cart
      const cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);

      const orderCouponHistory = await orderCouponService.getUserOrderCouponsHistory(
        user,
      );
      expect(orderCouponHistory.length).toBeGreaterThan(0);

      const coupon = orderCouponHistory[0].coupon;
      const result = hasUserUsedCoupon(orderCouponHistory, coupon.id);
      expect(result).toBeTruthy();
    });

    it('Test getEquivalentLocationCoupon()', async () => {
      const locationCoupons = await couponService.getActiveCoupons(location.id);
      const orderCoupon = { coupon: locationCoupons[0] } as OrderCoupon;
      const coupon = orderCoupon.coupon;
      const result = getEquivalentLocationCoupon(locationCoupons, orderCoupon);
      expect(result.id).toBe(coupon.id);
      expect(result.name).toBe(coupon.name);
    });

    it('Test isCouponActiveInLocation()', async () => {
      const locationCoupons = await couponService.getActiveCoupons(location.id);
      locationCoupons.forEach(({ couponLocations }) => {
        expect(
          isCouponActiveInLocation(couponLocations, location.id),
        ).toBeTruthy();
      });
    });

    it('Test canApplyWithOthers()', async () => {
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);

      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();
      expect(cart.coupons).toBeTruthy();
      expect(cart.coupons.length).toBeGreaterThan(0);

      let result = canApplyWithOthers(cart.coupons, cart.coupons[0].id);
      expect(result).toBeFalsy();

      // Add coupon
      const couponResult = await couponService.findCouponByCouponSku(
        location.id,
        coupons[0].couponSku,
      );
      expect(couponResult).toBeTruthy();

      result = canApplyWithOthers([], cart.coupons[0].id );
      expect(result).toBeTruthy();
    });

    it('Test refreshOrderCoupons()', async () => {
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const result = await orderCouponService.refreshOrderCoupons(cart);

      const orderCouponHistory = await orderCouponService.getUserOrderCouponsHistory(
        user,
      );

      const applicableCoupons = [];
      result.forEach(orderCoupon => {
        const { coupon } = orderCoupon;
        const existingData = result.filter(
          data => data.coupon.id === coupon.id,
        );
        // Should not duplicate
        expect(existingData.length).toBe(1);

        if (orderCoupon.applied && !orderCoupon.deleted) {
          if (coupon.isOneTimeUse) {
            expect(
              hasUserUsedCoupon(orderCouponHistory, coupon.id),
            ).toBeFalsy();
          }
          if (cart.fullfillmentMethod === FulfillmentMethod.PICKUP) {
            expect(coupon.isForPickup).toBeTruthy();
          }
          if (cart.fullfillmentMethod === FulfillmentMethod.DELIVERY) {
            expect(coupon.isForDelivery).toBeTruthy();
          }
          if (!coupon.isAutoApply && !coupon.applyWithOther) {
            expect(coupon.isAutoApply).toBeFalsy();
            expect(
              canApplyWithOthers(applicableCoupons, orderCoupon.id),
            ).toBeTruthy();
          }
          applicableCoupons.push(orderCoupon);
        }
        if (orderCoupon.deleted) {
          expect(orderCoupon.applied).toBeFalsy();
        }
      });
    });

    it('Test recheckExistingOrderCoupons()', async () => {
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      const locationCoupons = await couponService.getActiveCoupons(location.id);

      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const orderCoupons = locationCoupons.map(coupon => ({
        ...new OrderCoupon(),
        coupon,
        cart,
        applied: true,
      }));
      cart.coupons = orderCoupons;

      const result = orderCouponService.recheckExistingOrderCoupons(
        orderCoupons,
        cart,
        locationCoupons,
      );
      expect(result.length).toBe(cart.coupons.length);

      result.forEach(orderCoupon => {
        const { coupon } = orderCoupon;

        const existingData = cart.coupons.find(data => data.id === coupon.id);
        if (!existingData) {
          if (!coupon.isAutoApply) {
            expect(orderCoupon.deleted).toBeTruthy();
          } else {
            expect(orderCoupon.deleted).toBe(
              !isCouponActiveInLocation(
                coupon.couponLocations,
                cart.location.id,
              ) || orderCoupon.deleted,
            );
          }
        } else {
          expect(orderCoupon.applied).toBeTruthy();
        }
      });
    });

    it('Test applyCouponFlags()', async () => {
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const orderCouponHistory = await orderCouponService.getUserOrderCouponsHistory(
        user,
      );

      const locationCoupons = await couponService.getActiveCoupons(location.id);
      locationCoupons.forEach(coupon => {
        expect(coupon.isAutoApply).toBeTruthy();
        expect(coupon.deleted).toBeFalsy();
      });

      const orderCoupons = await orderCouponService.getOrderCoupons(cart.id);
      const recheckedCartCoupons = orderCouponService.recheckExistingOrderCoupons(
        orderCoupons,
        cart,
        locationCoupons,
      );

      const newOrderCoupons = locationCoupons
        .filter(
          ({ id }) =>
            !getAppliedCoupons(recheckedCartCoupons).find(
              ({ coupon }) => coupon.id === id,
            ),
        )
        .map(coupon => ({ ...new OrderCoupon(), coupon, cart, applied: true }));

      const result = orderCouponService.applyCouponFlags(
        [...recheckedCartCoupons, ...newOrderCoupons],
        cart,
        orderCouponHistory,
      );

      const applicableCoupons = [];
      result.forEach(orderCoupon => {
        const { coupon } = orderCoupon;
        if (orderCoupon.applied && !orderCoupon.deleted) {
          if (coupon.isOneTimeUse) {
            expect(
              hasUserUsedCoupon(orderCouponHistory, coupon.id),
            ).toBeFalsy();
          }
          if (cart.fullfillmentMethod === FulfillmentMethod.PICKUP) {
            expect(coupon.isForPickup).toBeTruthy();
          }
          if (cart.fullfillmentMethod === FulfillmentMethod.DELIVERY) {
            expect(coupon.isForDelivery).toBeTruthy();
          }
          if (!coupon.isAutoApply && !coupon.applyWithOther) {
            expect(coupon.isAutoApply).toBeFalsy();
            expect(
              canApplyWithOthers(applicableCoupons, orderCoupon.id),
            ).toBeTruthy();
          }
          applicableCoupons.push(orderCoupon);
        }
        if (orderCoupon.deleted) {
          expect(orderCoupon.applied).toBeFalsy();
        }
      });
    });

    it('Test addCoupon()', async () => {
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const couponResult = await couponService.findCouponByCouponSku(
        location.id,
        coupons[1].couponSku,
      );
      expect(couponResult).toBeTruthy();

      await orderCouponService.addCoupon(cart.id, couponResult.couponSku, user.id);
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const existingData = cart.coupons.find(
        orderCoupon => orderCoupon.coupon.couponSku === coupons[1].couponSku,
      );
      expect(existingData).toBeTruthy();
      expect(existingData.coupon.id).toBe(coupons[1].id);
      expect(existingData.coupon.couponSku).toBe(coupons[1].couponSku);
    });

    it('Test findOrderCoupon()', async () => {
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();
      
      const coupon = await couponService.findCouponByCouponSku(
        location.id,
        'MANUAL06',
      );
      expect(coupon).toBeTruthy();

      const result = await orderCouponService.findOrderCoupon(
        cart.id,
        coupon.id,
      );
      expect(result).toBeTruthy();
      expect(result.applied).toBeTruthy();
      expect(result.deleted).toBeFalsy();
    });

    it('Test isOrderCouponUsed()', async () => {
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      await orderService.submitOrder(cart.id, user.id);
      const coupon = await couponService.findCouponByCouponSku(
        location.id,
        coupons[0].couponSku,
      );
      expect(coupon).toBeTruthy();
      const result = orderCouponService.isOrderCouponUsed(coupon.id, user.id);
      expect(result).toBeTruthy();
    });

    it('Test getUserOrderCouponsHistory()', async () => {
      const result = await orderCouponService.getUserOrderCouponsHistory(user);
      result.forEach(orderCoupon => {
        expect(orderCoupon.order.orderStatus).not.toBe(OrderStatus.OPEN);
        expect(orderCoupon.order.orderStatus).not.toBe(OrderStatus.CANCELLED);
        expect(orderCoupon.order.orderStatus).not.toBe(OrderStatus.CLOSED);
        expect(orderCoupon.applied).toBeTruthy();
        expect(orderCoupon.deleted).toBeFalsy();
      });
    });

    it('Should get all order coupon, applied or not applied', async () => {
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);

      // Set cart to delivery
      await orderService.setOrderDelivery(
        cart.id,
        {
          id: cart.id,
          isDelivery: true,
          userAddressId: null,
        },
        user.id,
      );

      await orderCouponService.addCoupon(cart.id, coupons[2].couponSku, user.id); // Only in delivery

      // Set cart to pickup
      await orderService.setOrderDelivery(
        cart.id,
        {
          id: cart.id,
          isDelivery: false,
          userAddressId: null,
        },
        user.id,
      );

      const orderCoupons = await orderCouponService.getOrderCoupons(cart.id);
      expect(orderCoupons).toBeTruthy();
      expect(orderCoupons.length).toBeGreaterThan(0);      
      const isAppliedFound = orderCoupons.some(data => data.applied);
      expect(isAppliedFound).toBeTruthy();
      
      orderCoupons[0].applied = false;
      await orderCouponService.saveOrderCoupons([{
        ...orderCoupons[0],
        applied:false,
      }]);
      
      const isNotAppliedFound = orderCoupons.some(data => !data.applied);
      expect(isNotAppliedFound).toBeTruthy();
    });

    it('Test deleteCoupon()', async () => {
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const coupon = await couponService.findCouponByCouponSku(
        location.id,
        coupons[3].couponSku,
      );
      await orderCouponService.addCoupon(cart.id, coupon.couponSku, user.id);

      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      let existingData = cart.coupons.find(
        orderCoupon => orderCoupon.coupon.couponSku === coupons[3].couponSku,
      );
      expect(existingData).toBeTruthy();

      await orderCouponService.deleteCoupon(cart.id, coupon.id, user.id);

      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      existingData = cart.coupons.find(
        orderCoupon => orderCoupon.coupon.couponSku === coupons[3].couponSku
      );
      expect(existingData).toBeFalsy();
    });
  });

  describe('Expected Exceptions', () => {
    beforeAll(async () => {});

    it('Test addCoupon() if coupon not exist', async () => {
      const { couponInvalid: EXPECTED } = CouponExceptions;

      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      try {
        await orderCouponService.addCoupon(cart.id, 'NOTEXIST', user.id);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('Test addCoupon() if coupon already exist', async () => {
      const { couponInvalid: EXPECTED } = CouponExceptions;

      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      await couponService.updateCoupon({
        ...coupons[0],
        isOneTimeUse: false,
      });

      try {
        await orderCouponService.addCoupon(cart.id, coupons[0].couponSku, user.id);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('Test addCoupon() if coupon already used', async () => {
      const { couponInvalid: EXPECTED } = CouponExceptions;
      // Remove cart
      const cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      const prevCart = await orderService.getCart(user.id);
      expect(prevCart).toBeTruthy();
      coupons[2] = {
        ...coupons[2],
        isOneTimeUse: false,
        applyWithOther: true,
        isForDelivery: true,
      }
      await couponService.updateCoupon(coupons[2]);  
      const coupon = await couponService.findCouponByCouponSku(
        location.id,
        coupons[2].couponSku,
      );
      expect(coupon).toBeTruthy();
      await orderCouponService.addCoupon(
        prevCart.id,
        coupon.couponSku,
        user.id,
      );
      // Submit cart
      await orderService.submitOrder(prevCart.id, user.id);
      // Create cart again
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      const newCart = await orderService.getCart(user.id);
      expect(newCart).toBeTruthy();
      try {
        await orderCouponService.addCoupon(
          newCart.id,
          coupon.couponSku,
          user.id,
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
      await orderService.cancelOrder(prevCart.id, user.id);
    });

    it('Test addCoupon() if coupon not for manual', async () => {
      const { couponInvalid: EXPECTED } = CouponExceptions;

      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      try {
        await orderCouponService.addCoupon(cart.id, coupons[0].couponSku, user.id);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('Test addCoupon() if coupon not for pickup', async () => {
      const { couponInvalid: EXPECTED } = CouponExceptions;

      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      try {
        await orderCouponService.addCoupon(cart.id, coupons[0].couponSku, user.id);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('Test addCoupon() if coupon not for delivery', async () => {
      const { couponInvalid: EXPECTED } = CouponExceptions;

      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      try {
        await orderCouponService.addCoupon(cart.id, coupons[0].couponSku, user.id);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('Test addCoupon() if coupon cannot be used together with other coupon', async () => {
      const { couponNotApplyWithOther: EXPECTED } = CouponExceptions;
      // Remove cart
      let cart = await orderService.getCart(user.id);
      if (cart) await orderService.submitOrder(cart.id, user.id);
      // Add product to create a cart
      await orderService.addProductWeightToCart(
        user.id,
        product.pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      try {
        await orderCouponService.addCoupon(cart.id, coupons[0].couponSku, user.id);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });
  });
});