import { Test } from '@nestjs/testing';

import { startOfDay, endOfDay } from 'date-fns';

import { AppModule } from '../app.module';
import { User } from '../entities/user.entity';
import { LocationService } from '../location/location.service';
import { ProductService } from '../product/product.service';
import { UserExceptions } from '../user/user.exceptions';
import { UserService } from '../user/user.service';
import { OrderController } from './order.controller';
import { OrderExceptions } from './order.exceptions';
import { OrderService, TaxSetup, correctFloat } from './order.service';
import { RoleEnum } from '../roles/roles.enum';
import { OrderStatus, FulfillmentMethod } from './order-status.enum';
import {
  OrderUpdateDeliveryDto,
  OrderHistoryUpdateDto,
} from './dto/order-search.dto';
import { UserAddress } from '../entities/user-address.entity';
import { MOCK_USER_ADDRESSES } from '../../test/mocks/user.mock';
import { State } from '../entities/state.entity';
import { DiscountType, DiscountApplication } from '../entities/coupon.entity';
import { OrderViewType } from './order-view-type.enum';
import { OrderReportParams } from '../reports/params/order-params.interface';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import * as faker from 'faker';

describe('OrderController', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
  let orderService: OrderService;
  let userService: UserService;
  let locationService: LocationService;
  let productService: ProductService;
  let orderController: OrderController;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userService = module.get<UserService>(UserService);
    orderService = module.get<OrderService>(OrderService);
    locationService = module.get<LocationService>(LocationService);
    productService = module.get<ProductService>(ProductService);
    orderController = module.get<OrderController>(OrderController);
  });

  describe('Order Unit Tests', () => {
    let admin, user, siteAdmin;
    const IS_ADMIN = true;
    beforeAll(async () => {
      // Admin Role
      admin = await userService.findByEmail('admin_e2e@isbx.com');
      // User Role
      user = await userService.findByEmail('user_e2e@isbx.com');

      // Administrative Roles (requires migrations)
      siteAdmin = await userService.findByEmail('gd_site_admin@isbx.com');

      const cart = await orderService.getCart(user.id);
      if (cart) {
        await orderController.submitOrder(cart.id, { user });
      }
    });

    it('should get orders (Admin Role)', async () => {
      const orders = await orderController.search(
        { user: admin },
        '',
        'All',
        null,
        null,
        null,
        null,
        IS_ADMIN,
      );
      expect(orders[0].length).toBeGreaterThan(0);
    });

    it('should get orders (User Role)', async () => {
      const orders = await orderController.search({ user });
      expect(orders[0].length).toBeGreaterThan(0);
    });

    it('should allow User role get own orders only', async () => {
      const result = await orderService.findWithFilter(user, '', 'All');
      expect(result[0].length).toBeGreaterThan(0);
      let hasOtherOrder = false;
      for (const order of result[0]) {
        const orderDetail = await orderService.getOrder(order.id, user.id);
        if (user.id !== orderDetail.user.id) {
          hasOtherOrder = true;
        }
      }
      expect(hasOtherOrder).toBeFalsy();
    });

    it('should allow Admin role to get own orders only', async () => {
      // NOTE: Don't provide the includeDeleted flag here
      // This test aims to simulate request from Web (admin is a patient)
      // not as an admin from CMS.
      const result = await orderService.findWithFilter(admin, '', 'All');
      expect(result[0].length).toBeGreaterThan(0);
      let hasOtherOrder = false;
      for (const order of result[0]) {
        const orderDetail = await orderService.getOrder(order.id, admin.id);
        if (admin.id !== orderDetail.user.id) {
          hasOtherOrder = true;
        }
      }
      expect(hasOtherOrder).toBeFalsy();
    });

    it('should allow Admin to get orders of other users', async () => {
      const result = await orderService.findWithFilter(
        user,
        '',
        'All',
        null,
        null,
        null,
        null,
        IS_ADMIN,
      );
      expect(result[0].length).toBeGreaterThan(0);
      let includesOtherOrders = false;
      await Promise.all(
        result[0].map(async order => {
          // const orderDetail = await orderService.getOrder(order.id, user.id);
          if (user.id !== order.userId) {
            includesOtherOrders = true;
          }
        }),
      );
      expect(includesOtherOrders).toBeTruthy();
    });

    it('should allow Site Admin to get orders of other users', async () => {
      const result = await orderService.findWithFilter(
        siteAdmin,
        '',
        'All',
        null,
        null,
        null,
        null,
        IS_ADMIN,
      );
      expect(result[0].length).toBeGreaterThan(0);
      let includesOtherOrders = false;
      await Promise.all(
        result[0].map(async order => {
          // const orderDetail = await orderService.getOrder(order.id, user.id);
          if (user.id !== order.userId) {
            includesOtherOrders = true;
          }
        }),
      );
      expect(includesOtherOrders).toBeTruthy();
    });

    // TODO add unit test for EMPLOYEE retriveal of orders in their location only

    it('should get orders of a user with the correct total price', async () => {
      const orders = await orderService.findWithFilter(user);
      expect(orders[0].length).toBeGreaterThan(0);
      orders[0].forEach(async orderData => {
        const orderDetail = await orderController.getOne(
          { user },
          orderData.id,
        );
        expect(orderDetail).toBeTruthy();
        expect(orderDetail.products.length).toBeGreaterThan(0);

        let total = 0;
        orderDetail.products.forEach(async product => {
          total += product.price * product.quantity;
        });
        expect(orderData.totalPrice).toBe(parseFloat(total.toFixed(2)));
      });
    });

    it('should still get hidden product in order', async () => {
      const orders = await orderService.findWithFilter(user);
      expect(orders[0].length).toBeGreaterThan(0);

      const order = orders[0][0];
      const orderDetail = await orderController.getOne({ user }, order.id);
      const productCount = order.productCount;

      const hiddenProductId = orderDetail.products[0].id;
      const hiddenProduct = await productService.findById(
        hiddenProductId,
        null,
        null,
        null,
        true,
      );
      hiddenProduct.hidden = true;
      await productService.update(hiddenProduct);

      const updatedOrders = await orderService.findWithFilter(user);
      const updatedOrder = updatedOrders[0][0];
      const updatedProductCount = updatedOrder.productCount;

      expect(productCount).toEqual(updatedProductCount);
    });

    it('should add product to cart', async () => {
      const location = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'NG Prod 1',
      });

      await orderController.addProductWeightToCart(
        products[0][0].pricing.weightPrices[0].id,
        { user },
      );

      const cart = await orderService.getCart(user.id);
      expect(cart.products.length).toBeGreaterThan(0);

      const cartProducts = cart.products.map(
        orderProduct => orderProduct.product,
      );
      const isReorderedInCart = cartProducts.find(
        p => p.id === products[0][0].id,
      );
      expect(isReorderedInCart).toBeTruthy();
    });

    it('should still get hidden product in cart', async () => {
      const cart = await orderService.getCart(user.id);
      const productCount = cart.products.length;
      expect(productCount).toBeGreaterThan(0);

      const hiddenProduct = await productService.findById(
        cart.products[0].id,
        null,
        null,
        null,
        true,
      );
      hiddenProduct.hidden = true;
      await productService.update(hiddenProduct);

      const updatedCart = await orderService.getCart(user.id);
      const updatedProductCount = updatedCart.products.length;

      expect(productCount).toEqual(updatedProductCount);
    });

    it('should add product from other dispensary if has no products on the cart', async () => {
      const cart = await orderService.getCart(user.id);
      expect(cart.products.length).toBeGreaterThan(0);

      cart.products.forEach(async product => {
        await orderService.removeProductFromOrder(cart.id, product.id, user.id);
      });

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 1',
      });

      await orderController.addProductWeightToCart(
        products[0][0].pricing.weightPrices[0].id,
        { user },
      );

      const newCart = await orderService.getCart(user.id);
      expect(newCart.id).not.toBe(cart.id);
    });

    it('should submit order', async () => {
      const cart = await orderService.getCart(user.id);
      await orderController.submitOrder(cart.id, { user });

      const result = await orderService.getOrder(cart.id, user.id);
      expect(result.id).toBe(cart.id);
      expect(result).toHaveProperty('orderStatus', OrderStatus.SUBMITTED);
    });

    it('should cancel order', async () => {
      const orders = await orderService.findWithFilter(user);
      await orderService.cancelOrder(orders[0][0].id, user.id);
      const result = await orderService.getOrder(orders[0][0].id, user.id);
      expect(result.id).toBe(orders[0][0].id);
      expect(result).toHaveProperty('orderStatus', OrderStatus.CANCELLED);
    });

    it('should reorder products', async () => {
      const orders = await orderService.findWithFilter(user);
      const sourceOrder = await orderService.getOrder(orders[0][0].id, user.id);
      expect(sourceOrder.products.length).toBeGreaterThan(0);

      await orderController.reOrderProducts(sourceOrder.id, { user });

      const cart = await orderService.getCart(user.id);
      expect(cart.id).not.toBe(sourceOrder.id);
      expect(cart).toHaveProperty('orderStatus', OrderStatus.OPEN);
      expect(cart.products.length).toBeGreaterThan(0);

      const sourceProducts = sourceOrder.products.map(
        orderProduct => orderProduct.product,
      );
      const cartProducts = cart.products.map(
        orderProduct => orderProduct.product,
      );
      sourceProducts.forEach(product => {
        if (product.isInStock) {
          const isReorderedInCart = cartProducts.find(p => p.id === product.id);
          expect(isReorderedInCart).toBeTruthy();
        }
      });
    });

    it('should compute taxes totals', async () => {
      const taxedUser = await userService.findByEmail('jortega@isbx.com');
      const location = await locationService.findWithFilter({ search: 'CVS' });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'CVS',
      });
      const product = products[0][0];
      expect(product).toBeTruthy();

      // Add 1 product and change to 3 qty
      const orderProduct = await orderService.addProductToCart(
        taxedUser.id,
        product.id,
      );
      const QTY = 3;
      await orderService.updateProductQuantity(
        orderProduct.id,
        QTY,
        taxedUser.id,
      );

      const cart = await orderService.getCart(taxedUser.id);
      expect(cart.products.length).toBeGreaterThan(0);
      const subTotal = cart.products
        .map(p => p.price * p.quantity)
        .reduce((total, price) => total + price);
      const expectedTaxTotal = correctFloat(
        subTotal * (TaxSetup.muniTaxPercent / 100) +
          subTotal * (TaxSetup.stateTaxPercent / 100),
      );

      await orderController.submitOrder(cart.id, { user: taxedUser });
      const order = await orderService.getOrder(cart.id, taxedUser.id);
      expect(order.orderTax).toBeTruthy();
      expect(correctFloat(order.taxTotal)).toBe(expectedTaxTotal);
      expect(correctFloat(order.orderTotal)).toBe(subTotal + expectedTaxTotal);
    });

    it('should set delivery info if is delivery', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot Delivery`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          patientNumber: 'PA18-00000002',
        },
      };
      const newUser = await userService.register(info);
      expect(newUser.id).toBeTruthy();
      const addr = {
        ...new UserAddress(),
        ...MOCK_USER_ADDRESSES[0],
        state: new State(),
        userId: newUser.id,
      };
      addr.state.id = MOCK_USER_ADDRESSES[0].state;
      const userAddress = await userService.createUserAddress(addr);
      expect(userAddress.id).toBeTruthy();

      const location = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'NG Prod 1',
      });
      await orderService.addProductWeightToCart(
        newUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(newUser.id);
      expect(cart.products.length).toBeGreaterThan(0);

      const deliveryOrder = await orderService.setOrderDelivery(
        cart.id,
        {
          id: cart.id,
          isDelivery: true,
          userAddressId: userAddress.id,
        } as OrderUpdateDeliveryDto,
        newUser.id,
      );
      expect(deliveryOrder.isDelivery).toBeTruthy();
      expect(deliveryOrder.fullfillmentMethod).toBe(FulfillmentMethod.DELIVERY);
      expect(deliveryOrder.deliveryAddressLine1 || '').toBe(
        addr.addressLine1 || '',
      );
      expect(deliveryOrder.deliveryAddressLine2 || '').toBe(
        addr.addressLine2 || '',
      );
      expect(deliveryOrder.deliveryCity || '').toBe(addr.city || '');
      expect(deliveryOrder.deliveryInstruction || '').toBe(
        addr.instruction || '',
      );
      expect(deliveryOrder.deliveryPostalCode || '').toBe(
        addr.postalCode || '',
      );
      expect(deliveryOrder.deliveryState.id).toBe(addr.state.id);
    });

    it('should unset delivery info if not delivery, default to pickup', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot Delivery`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          patientNumber: 'PA18-00000002',
        },
      };

      const newUser = await userService.register(info);
      expect(newUser.id).toBeTruthy();
      const addr = {
        ...new UserAddress(),
        ...MOCK_USER_ADDRESSES[0],
        state: new State(),
        userId: newUser.id,
      };
      addr.state.id = MOCK_USER_ADDRESSES[0].state;
      const userAddress = await userService.createUserAddress(addr);
      expect(userAddress.id).toBeTruthy();

      const location = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'NG Prod 1',
      });
      await orderService.addProductWeightToCart(
        newUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(newUser.id);
      expect(cart.products.length).toBeGreaterThan(0);

      const deliveryOrder = await orderService.setOrderDelivery(
        cart.id,
        {
          id: cart.id,
          isDelivery: false,
          userAddressId: userAddress.id,
        } as OrderUpdateDeliveryDto,
        newUser.id,
      );
      expect(deliveryOrder.isDelivery).toBeFalsy();
      expect(deliveryOrder.fullfillmentMethod).toBe(FulfillmentMethod.PICKUP);
      expect(deliveryOrder.deliveryAddressLine1).toBeFalsy();
      expect(deliveryOrder.deliveryAddressLine2).toBeFalsy();
      expect(deliveryOrder.deliveryCity).toBeFalsy();
      expect(deliveryOrder.deliveryInstruction).toBeFalsy();
      expect(deliveryOrder.deliveryPostalCode).toBeFalsy();
      expect(deliveryOrder.deliveryState).toBeFalsy();
    });

    it('should allow patient owner to set own order delivery method', async () => {
      const deliveryUser = await userService.findByEmail(
        'user+delivery@isbx.com',
      );
      expect(deliveryUser.roles.map(r => r.name)).toContain(RoleEnum.Patient);

      const addr = {
        ...new UserAddress(),
        ...MOCK_USER_ADDRESSES[0],
        state: new State(),
        userId: deliveryUser.id,
      };
      addr.state.id = MOCK_USER_ADDRESSES[0].state;
      const userAddresses = await userService.getUserAddresses(deliveryUser.id);
      const userAddress =
        userAddresses.length > 0
          ? userAddresses[0]
          : await userService.createUserAddress(addr);
      expect(userAddress.id).toBeTruthy();

      let cart = await orderService.getCart(deliveryUser.id);
      if (!cart) {
        const location = await locationService.findWithFilter({
          search: 'ISBX',
        });
        const products = await productService.findWithFilter({
          locationId: location[0][0].id,
          search: 'Product 1',
        });
        await orderService.addProductWeightToCart(
          deliveryUser.id,
          products[0][0].pricing.weightPrices[0].id,
        );
        cart = await orderService.getCart(deliveryUser.id);
      }
      expect(cart.products.length).toBeGreaterThan(0);
      let deliveryOrder = null;

      deliveryOrder = await orderService.setOrderDelivery(
        cart.id,
        {
          id: cart.id,
          isDelivery: true,
          userAddressId: userAddress.id,
        } as OrderUpdateDeliveryDto,
        deliveryUser.id,
      );
      expect(deliveryOrder.id).toBeTruthy();
      expect(deliveryOrder.isDelivery).toBeTruthy();
    });

    it('should allow admin to set other users order delivery method', async () => {
      const deliveryUser = await userService.findByEmail(
        'user+delivery@isbx.com',
      );
      expect(deliveryUser.roles.map(r => r.name)).toContain(RoleEnum.Patient);

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 1',
      });

      let cart = await orderService.getCart(deliveryUser.id);
      if( cart && cart.products.length > 0 ){
        await orderService.removeAllProductsFromCart(deliveryUser.id);
      }
      
      await orderService.addProductWeightToCart(
        deliveryUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(deliveryUser.id);

      expect(cart.products.length).toBeGreaterThan(0);
      const deliveryOrder = await orderService.setOrderDelivery(
        cart.id,
        {
          id: cart.id,
          isDelivery: false,
          userAddressId: null,
        } as OrderUpdateDeliveryDto,
        admin.id,
      );
      expect(deliveryOrder.id).toBeTruthy();
      expect(deliveryOrder.isDelivery).toBeFalsy();
    });

    // TODO fix incorrect EXPECTED OR ACTUAL and remove xit
    // Expected: 11.99 Received: 15
    xit('should compute order properly', async () => {
      // create a user
      const ts = Date.now();
      const userInfo = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Test for Computation`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          patientNumber: 'PA18-00000002',
        },
      };

      const newUser = await userService.register(userInfo);
      expect(newUser.id).toBeTruthy();
      const address = {
        ...new UserAddress(),
        ...MOCK_USER_ADDRESSES[0],
        state: new State(),
        userId: newUser.id,
      };
      address.state.id = MOCK_USER_ADDRESSES[0].state;
      const userAddress = await userService.createUserAddress(address);
      expect(userAddress.id).toBeTruthy();

      // create a delivery order
      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 1',
      });
      await orderService.addProductWeightToCart(
        newUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(newUser.id);
      expect(cart.products.length).toBeGreaterThan(0);
      const order = await orderService.setOrderDelivery(
        cart.id,
        {
          id: cart.id,
          isDelivery: true,
          userAddressId: userAddress.id,
        } as OrderUpdateDeliveryDto,
        newUser.id,
      );
      expect(order.id).toBeTruthy();
      expect(order.isDelivery).toBeTruthy();

      const productTotal = order.products.reduce((sum, orderProduct) => {
        return (sum += orderProduct.price * orderProduct.quantity);
      }, 0);

      // expect discount total
      const coupons = order.coupons.map(oc => oc.coupon);
      const discounts = coupons.reduce((sum, coupon) => {
        if (coupon.discountApplication === DiscountApplication.Subtotal) {
          if (coupon.discountType === DiscountType.Fixed) {
            sum += coupon.discountAmount;
          } else {
            // as a percentage
            const amount = productTotal * (coupon.discountAmount / 100);
            sum += amount;
          }
          return sum;
        } else {
          const lineItemDiscount = order.products.reduce(
            (discountSum, orderProduct) => {
              if (coupon.discountType === DiscountType.Fixed) {
                discountSum += coupon.discountAmount;
              } else {
                const orderProductTotal =
                  orderProduct.price * orderProduct.quantity;
                // as a percentage
                const amount =
                  orderProductTotal * (coupon.discountAmount / 100);
                discountSum += amount;
              }
              return discountSum;
            },
            0,
          );
          return (sum += lineItemDiscount);
        }
      }, 0);
      expect(order.couponTotal).toEqual(+discounts.toFixed(2));

      // expect deliveryFee
      const locationHasDeliveryFee =
        order.location.deliveryFee != null &&
        order.location.deliveryFeePatientPercentage != null;
      const expectedDeliveryFee = locationHasDeliveryFee
        ? order.location.deliveryFee *
          order.location.deliveryFeePatientPercentage
        : 15.0;
      expect(order.deliveryPatientFee).toEqual(expectedDeliveryFee);

      // expect orderTotal
      const expectedOrderTotal =
        productTotal - discounts + order.taxTotal + order.deliveryPatientFee;
      expect(order.orderTotal).toEqual(+expectedOrderTotal.toFixed(2));
    });

    it('cart should remain open after removing all items ', async () => {
      const cart = await orderService.getCart(user.id);
      if (cart) {
        // remove current Cart
        await orderService.submitOrder(cart.id, user.id);
      }

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 1',
      });
      // create new Cart
      await orderService.addProductWeightToCart(
        user.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const newCart = await orderService.getCart(user.id);
      expect(newCart).toBeTruthy();
      expect(newCart.products.length).toBeGreaterThan(0);

      await orderService.removeAllProductsFromCart(user.id);

      const cartWithNoProducts = await orderService.getCart(user.id);
      expect(cartWithNoProducts.orderStatus).toBe(OrderStatus.OPEN);
      expect(cartWithNoProducts.products.length).toEqual(0);
    });

    it('should create new cart if current cart has no product and from different dispensary', async () => {
      const cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();
      expect(cart.orderStatus).toBe(OrderStatus.OPEN);
      expect(cart.products.length).toEqual(0);

      const location = await locationService.findWithFilter({
        search: 'BWell Ocean',
      });
      expect(cart.location.id).not.toBe(location[0][0].id);
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Active - Mango',
      });
      // add prodcut for new Cart
      await orderService.addProductWeightToCart(
        user.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const newCart = await orderService.getCart(user.id);
      expect(newCart.products.length).toBeGreaterThan(0);

      const oldCart = await orderService.getOrder(cart.id, user.id);
      expect(oldCart.orderStatus).toBe(OrderStatus.CLOSED);
      expect(oldCart.id).not.toBe(newCart.id);
    });

    it('should change order history created date and createdBy', async () => {
      // create new user
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot Delivery`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          patientNumber: 'PA18-00000002',
        },
      };
      const newUser = await userService.register(info);
      expect(newUser.id).toBeTruthy();

      // create new order
      const location = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'NG Prod 1',
      });
      await orderService.addProductWeightToCart(
        newUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(newUser.id);
      expect(cart.products.length).toBeGreaterThan(0);

      // cancel order
      await orderService.cancelOrder(cart.id, newUser.id);
      const cancelledOrderResult = await orderService.getOrder(
        cart.id,
        newUser.id,
      );
      expect(cancelledOrderResult.id).toBe(cart.id);
      expect(cancelledOrderResult).toHaveProperty(
        'orderStatus',
        OrderStatus.CANCELLED,
      );

      // over ride order history date
      const date = new Date(2019, 1, 1);
      const cancelledOrder = await orderService.getOrder(cart.id, newUser.id);
      const cancelHistory = cancelledOrder.history.find(
        h => h.orderStatus === OrderStatus.CANCELLED,
      );
      expect(cancelHistory.id).toBeTruthy();
      const orderHistoryModifiedInfo: OrderHistoryUpdateDto = {
        created: date,
        createdBy: admin.id,
        orderStatus: OrderStatus.CANCELLED,
        orderHistoryId: cancelHistory.id,
        orderId: cancelledOrder.id,
      };

      await orderService.overrideHistoryCreatedDate(
        cancelledOrder.id,
        admin.id,
        orderHistoryModifiedInfo,
      );

      const updatedOrder = await orderService.getOrder(
        cancelledOrder.id,
        admin.id,
        true,
      );
      const updatedCancelHistory = updatedOrder.history.find(
        h => h.orderStatus === OrderStatus.CANCELLED,
      );
      expect(updatedCancelHistory.createdBy).toBe(admin.id);
      expect(updatedCancelHistory.created).toEqual(date);
    });

    it('should get the order count per location', async () => {
      // Locations with different timezone
      const locationsData = [
        { locationName: 'ISBX', productName: 'Product 1' },
        { locationName: 'NextGen Dispensary', productName: 'NG Prod 1' },
        { locationName: 'Rizal', productName: 'Rizal Rapsa' },
      ];

      let cart = await orderService.getCart(user.id);
      if (cart) {
        await orderService.submitOrder(cart.id, user.id);
      }
      for (const locationData of locationsData) {
        const location = await locationService.findWithFilter({
          search: locationData.locationName,
        });
        const products = await productService.findWithFilter({
          locationId: location[0][0].id,
          search: locationData.productName,
        });

        await orderController.addProductToCart(products[0][0].id, {
          user,
        });

        cart = await orderService.getCart(user.id);
        await orderService.submitOrder(cart.id, user.id);
      }

      const orderCountInDaily = await orderService.getOrderCountSummary(
        OrderViewType.DAILY,
        admin,
      );
      const orderCountWeekly = await orderService.getOrderCountSummary(
        OrderViewType.WEEKLY,
        admin,
      );
      const orderCountMonthly = await orderService.getOrderCountSummary(
        OrderViewType.MONTHLY,
        admin,
      );
      locationsData.forEach(locationData => {
        const resultInDaily = orderCountInDaily.find(orderCount =>
          orderCount.locationName.includes(locationData.locationName),
        );
        expect(+resultInDaily.totalCount).toBeGreaterThan(0);
        expect(+resultInDaily.submittedCount).toBeGreaterThan(0);

        const resultInWeekly = orderCountWeekly.find(orderCount =>
          orderCount.locationName.includes(locationData.locationName),
        );
        expect(+resultInWeekly.totalCount).toBeGreaterThan(0);
        expect(+resultInWeekly.submittedCount).toBeGreaterThan(0);

        const resultInMonthly = orderCountMonthly.find(orderCount =>
          orderCount.locationName.includes(locationData.locationName),
        );
        expect(+resultInMonthly.totalCount).toBeGreaterThan(0);
        expect(+resultInMonthly.submittedCount).toBeGreaterThan(0);
      });
    });

    it('should get orders for csv by location', async () => {
      // Locations with different timezone
      const locationNames = ['ISBX', 'NextGen Dispensary', 'Rizal'];

      for (const locationName of locationNames) {
        const locations = await locationService.findWithFilter({
          search: locationName,
        });
        const orders = await orderService.findWithFilter(
          admin,
          '',
          'All',
          null,
          null,
          null,
          locations[0][0].id,
          true,
        );
        const location = locations[0][0];
        const order = orders[0][0];

        expect(location).toBeTruthy();

        if (order) {
          await orderService.createOrderHistory(
            admin.id,
            order.id,
            order.orderStatus as OrderStatus,
          );

          const modifiedDateFrom = startOfDay(
            new Date().toLocaleString('en-US', {
              timeZone: location.timezone,
            }),
          );

          const modifiedDateTo = endOfDay(
            new Date().toLocaleString('en-US', {
              timeZone: location.timezone,
            }),
          );
          const params: OrderReportParams = {
            locationId: location.id,
            modifiedDateFrom,
            modifiedDateTo,
          };
          const csvResults = await orderService.getOrdersForCsv(params);
          expect(csvResults.length).toBeGreaterThan(0);
          const existingData = csvResults.find(data => data.id === order.id);
          expect(existingData).toBeTruthy();
        }
      }
    });

    it('should change the orderStatus to Closed', async () => {
      let cart = await orderService.getCart(user.id);
      if (cart) {
        // remove current Cart
        await orderService.submitOrder(cart.id, user.id);
      }

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 1',
      });
      // create new Cart
      await orderService.addProductWeightToCart(
        user.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      cart = await orderService.getCart(user.id);
      expect(cart.orderStatus).toBe(OrderStatus.OPEN);

      await orderService.closeOrder(cart.id, user.id);

      const result = await orderService.getOrder(cart.id, user.id);
      expect(result.orderStatus).toBe(OrderStatus.CLOSED);
    });
  });

  describe('Expected Exceptions', () => {
    let admin, user;
    beforeAll(async () => {
      // Admin Role
      admin = await userService.findByEmail('admin_e2e@isbx.com');
      // User Role
      user = await userService.findByEmail('user_e2e@isbx.com');
    });

    /**
     * IMPORTANT: for testing Expected Exceptions are thrown, force the unit test to count
     * its assertions by adding expect.assertions(NUMBER_OF_EXPECTS) to the test.
     * This is to make sure it runs the expect statements that check async methods that
     * are wrapped in try-catch. Otherwise it will be evergreen.
     */

    it('should not allow non-admin to get all orders', async () => {
      const NUMBER_OF_EXPECTS = 3;
      expect.assertions(NUMBER_OF_EXPECTS);

      const { noAdminRights: EXPECTED } = UserExceptions;
      const { Admin, SiteAdmin, Employee } = RoleEnum;
      expect(
        EXPECTED.failCondition({
          userRoles: user.roles,
          allowedRoles: [Admin, SiteAdmin, Employee],
        }),
      ).toBeTruthy(); // verify that user does have no admin right

      // now check that the exception is thrown
      try {
        const orders = await orderController.search(
          { user },
          '',
          'All',
          null,
          null,
          null,
          null,
          true,
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not add product from other dispensary to cart', async () => {
      const NUMBER_OF_EXPECTS = 4;
      expect.assertions(NUMBER_OF_EXPECTS);
      const cart = await orderService.getCart(user.id);
      if (cart) {
        // remove cart
        await orderService.submitOrder(cart.id, user.id);
      }
      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const locationProducts = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 1',
      });
      // create new Cart
      await orderService.addProductWeightToCart(
        user.id,
        locationProducts[0][0].pricing.weightPrices[0].id,
      );

      const newCart = await orderService.getCart(user.id);
      expect(newCart).toBeTruthy();

      const otherLocation = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const otherLocationProducts = await productService.findWithFilter({
        locationId: otherLocation[0][0].id,
        search: 'NG Prod 1',
      });
      // current cart should not be the same location we're testing, to trigger the exception
      expect(newCart.location.id).not.toBe(otherLocation[0][0].id);

      // now check that the exception is thrown
      const { invalidLocation: EXPECTED } = OrderExceptions;
      try {
        await orderController.addProductToCart(otherLocationProducts[0][0].id, {
          user,
        });
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not order unpriced product', async () => {
      const NUMBER_OF_EXPECTS = 5;
      expect.assertions(NUMBER_OF_EXPECTS);

      const cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      // current cart should match same location we're testing to not repeat invalidLocationException
      expect(cart.location.id).toBe(location[0][0].id);

      // the product we're testing should be truly unpriced.
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 4 No price',
        page: 0,
        limit: 10,
        order: null,
        paginated: true,
      }); // mock product with no price
      const unpricedProduct = products[0][0];
      const HAS_PRICES =
        unpricedProduct.pricing &&
        (unpricedProduct.pricing.price || unpricedProduct.pricing.weightPrices);
      expect(HAS_PRICES).toBeFalsy();

      // now check that the exception is thrown
      const { productHasNoPrice: EXPECTED } = OrderExceptions;
      try {
        await orderController.addProductToCart(unpricedProduct.id, { user });
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it.skip('should not add out-of-stock product to cart', async () => {
      const NUMBER_OF_EXPECTS = 5;
      expect.assertions(NUMBER_OF_EXPECTS);

      const cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      // current cart should match same location we're testing to not repeat invalidLocationException
      expect(cart.location.id).toBe(location[0][0].id);

      // the product we're testing should be truly out of stock.
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Out Stock Product 5',
        page: 0,
        limit: 10,
        order: null,
        paginated: true,
      }); // mock product always out of stock
      const outOfStockProduct = products[0][0];
      expect(outOfStockProduct.isInStock).toBe(false);

      // now check that the exception is thrown
      const { outOfStockProductToCart: EXPECTED } = OrderExceptions;
      try {
        await orderController.addProductToCart(outOfStockProduct.id, { user });
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not submit order if phone number is not verified', async () => {
      const NUMBER_OF_EXPECTS = 5;
      expect.assertions(NUMBER_OF_EXPECTS);
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          verified: false,
          mobileNumber: '+1-777-555-0000',
          patientNumber: 'PA18-00000001',
        },
      };

      const newUser = await userService.register(info);
      expect(newUser.id).toBeTruthy();
      expect(newUser.verified).toBeFalsy();
      const location = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'NG Prod 1',
      });
      await orderService.addProductWeightToCart(
        newUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(newUser.id);
      expect(cart.products.length).toBeGreaterThan(0);

      const { userNotVerified: EXPECTED } = UserExceptions;
      try {
        await orderController.submitOrder(cart.id, { user: newUser });
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not submit order if no mobile number', async () => {
      const NUMBER_OF_EXPECTS = 5;
      expect.assertions(NUMBER_OF_EXPECTS);
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          patientNumber: 'PA18-00000002',
        },
      };
      const newUser = await userService.register(info);
      expect(newUser.id).toBeTruthy();
      expect(newUser.mobileNumber).toBeFalsy();

      const location = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'NG Prod 1',
      });
      await orderService.addProductWeightToCart(
        newUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(newUser.id);
      expect(cart.products.length).toBeGreaterThan(0);

      const { userHasNoMobileNumber: EXPECTED } = OrderExceptions;
      try {
        await orderController.submitOrder(cart.id, { user: newUser });
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    /**
     * Skipped
     * GD-251: disabled Patient ID requirement
     */
    xit('should not submit order if no patient id', async () => {
      const NUMBER_OF_EXPECTS = 5;
      expect.assertions(NUMBER_OF_EXPECTS);
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          verified: true,
          mobileNumber: '+1-777-555-0000',
        },
      };
      const newUser = (await userService.create(info)) as User;
      expect(newUser.id).toBeTruthy();
      expect(newUser.patientNumber).toBeFalsy();

      const location = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'NG Prod 1',
      });
      await orderService.addProductWeightToCart(
        newUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(newUser.id);
      expect(cart.products.length).toBeGreaterThan(0);

      const { userHasNoPatientId: EXPECTED } = OrderExceptions;
      try {
        await orderController.submitOrder(cart.id, { user: newUser });
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    // Disabled unit test, submit order from closed location is now allowed
    xit('should not submit order if location closed', async () => {
      const user420 = await userService.findByEmail('hberry@isbx.com');
      const NUMBER_OF_EXPECTS = 5;
      expect.assertions(NUMBER_OF_EXPECTS);

      const locations = await locationService.findWithFilter({
        search: 'ForeverClosed',
      });
      const products = await productService.findWithFilter({
        locationId: locations[0][0].id,
        search: 'ForeverClosedProduct',
      });
      const foreverClosedProduct = products[0][0];
      expect(foreverClosedProduct).toBeTruthy();

      await orderService.addProductToCart(user420.id, foreverClosedProduct.id);
      const cart = await orderService.getCart(user420.id);
      expect(cart.products.length).toBeGreaterThan(0);
      expect(cart.location.id).toBe(locations[0][0].id);

      const { locationClosed: EXPECTED } = OrderExceptions;
      try {
        await orderController.submitOrder(cart.id, { user: user420 });
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not add order more than 10 items per product', async () => {
      const NUMBER_OF_EXPECTS = 4;
      expect.assertions(NUMBER_OF_EXPECTS);

      const cart = await orderService.getCart(user.id);
      expect(cart).toBeTruthy();

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      // current cart should match same location we're testing to not repeat invalidLocationException
      expect(cart.location.id).toBe(location[0][0].id);

      const orderProduct = cart.products[0];

      await orderService.updateProductQuantity(orderProduct.id, 10, user.id);

      // now check that the exception is thrown
      const { exceededAllowedQuantity: EXPECTED } = OrderExceptions;
      try {
        const test = await orderController.addProductToCart(
          orderProduct.product.id,
          {
            user,
          },
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should require user address for delivery', async () => {
      const NUMBER_OF_EXPECTS = 2;
      expect.assertions(NUMBER_OF_EXPECTS);

      const ts = +new Date(); // force ms
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot Delivery`,
          email: `user+${ts}@isbx.com`,
          password: `password`,
          patientNumber: 'PA18-00000002',
        },
      };
      const newUserNoDeliveryAddress = await userService.register(info);
      expect(newUserNoDeliveryAddress.id).toBeTruthy();

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 1',
      });
      await orderService.addProductWeightToCart(
        newUserNoDeliveryAddress.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(newUserNoDeliveryAddress.id);
      expect(cart.products.length).toBeGreaterThan(0);

      // now check that the exception is thrown
      const { userAddressRequiredForDelivery: EXPECTED } = OrderExceptions;
      try {
        const deliveryOrder = await orderService.setOrderDelivery(
          cart.id,
          {
            id: cart.id,
            isDelivery: true,
            // userAddressId: null
          } as OrderUpdateDeliveryDto,
          newUserNoDeliveryAddress.id,
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not allow non-owner to set delivery to cart', async () => {
      const NUMBER_OF_EXPECTS = 6;
      expect.assertions(NUMBER_OF_EXPECTS);

      const orderOwner = await userService.findByEmail(
        'user+delivery@isbx.com',
      );
      const orderOwnerAddresses = await userService.getUserAddresses(
        orderOwner.id,
      );
      const cart = await orderService.getCart(orderOwner.id);
      expect(orderOwner.id).toBeTruthy();
      expect(orderOwnerAddresses.length).toBeGreaterThan(0);
      expect(cart.products.length).toBeGreaterThan(0);

      const ts = faker.random.number({ min: 10000000, max: 99999999 }); // force ms
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot Delivery`,
          email: `user+${ts}@isbx.com`,
          password: `password`,
          patientNumber: `PA18-${ts}`,
        },
      };
      const otherUser = await userService.register(info);
      expect(otherUser.id).toBeTruthy();

      const { patientNotOrderOwner: EXPECTED } = OrderExceptions;
      try {
        const deliveryOrder = await orderService.setOrderDelivery(
          cart.id,
          {
            id: cart.id,
            isDelivery: true,
            userAddressId: orderOwnerAddresses[0].id,
          } as OrderUpdateDeliveryDto,
          otherUser.id,
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not allow future order modified date', async () => {
      const NUMBER_OF_EXPECTS = 6;
      expect.assertions(NUMBER_OF_EXPECTS);

      const ts = +new Date(); // force ms
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot Delivery`,
          email: `user+${ts}@isbx.com`,
          password: `password`,
          patientNumber: 'PA18-00000002',
        },
      };
      const mockUser = await userService.register(info);
      expect(mockUser.id).toBeTruthy();

      const location = await locationService.findWithFilter({ search: 'ISBX' });
      const products = await productService.findWithFilter({
        locationId: location[0][0].id,
        search: 'Product 1',
      });
      await orderService.addProductWeightToCart(
        mockUser.id,
        products[0][0].pricing.weightPrices[0].id,
      );
      const cart = await orderService.getCart(mockUser.id);
      expect(cart.products.length).toBeGreaterThan(0);
      await orderService.submitOrder(cart.id, mockUser.id);

      // Step 1 - do mistaken Cancel
      await orderService.cancelOrder(cart.id, admin.id);

      // Step 2 - retrieve the order
      const orders = await orderService.findWithFilter(mockUser);
      const orderWithHistory = await orderService.getOrder(
        orders[0][0].id,
        mockUser.id,
      );
      expect(orderWithHistory.id).toBeTruthy();
      expect(orderWithHistory).toHaveProperty('history');

      // Step 3 - attempt future order modified date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const orderHistoryModifiedInfo: OrderHistoryUpdateDto = {
        created: futureDate,
        createdBy: admin.id,
        orderStatus: OrderStatus.CANCELLED,
        orderHistoryId: orderWithHistory.history[0].id,
        orderId: orderWithHistory.id,
      };

      const { futureOrderModifiedDate: EXPECTED } = OrderExceptions;
      try {
        await orderService.overrideHistoryCreatedDate(
          orderWithHistory.id,
          admin.id,
          orderHistoryModifiedInfo,
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not allow cart submission when atleast one of its product is not synced with the updated products from inventory', async () => {
      const NUMBER_OF_EXPECTS = 5;
      expect.assertions(NUMBER_OF_EXPECTS);

      await orderService.removeAllProductsFromCart(user.id);
      const [locations] = await locationService.findWithFilter({
        search: 'NextGen',
      });
      const [products] = await productService.findWithFilter({
        locationId: locations[0].id,
        search: 'NG Prod 1',
      });

      await orderController.addProductWeightToCart(
        products[0].pricing.weightPrices[0].id,
        { user },
      );

      const cart: Order = await orderService.getCart(user.id);
      expect(cart.products.length).toBeGreaterThan(0);

      let updatedProduct = await productService.update({
        ...products[0],
        name: `NG Prod 1 (updated) ${+ new Date()}`,
      } as Product);

      expect(updatedProduct.name).not.toEqual(products[0].name);

      const { orderProductMismatchFromInventory: EXPECTED } = OrderExceptions;
      try {
        await orderController.submitOrder(cart.id, { user });
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }

      updatedProduct = await productService.update({
        ...updatedProduct,
        name: products[0].name
      });

      expect(updatedProduct.name).toEqual(products[0].name);
    });
  });
});
