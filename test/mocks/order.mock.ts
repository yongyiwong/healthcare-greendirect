import * as _ from 'lodash';
import * as log from 'fancy-log';

import { TestingModule } from '@nestjs/testing';

import { OrderProduct } from '../../src/entities/order-product.entity';
import { Product } from '../../src/entities/product.entity';
import { User } from '../../src/entities/user.entity';
import { LocationService } from '../../src/location/location.service';
import { OrderService } from '../../src/order/order.service';
import { ProductService } from '../../src/product/product.service';
import { UserService } from '../../src/user';
import { Organization } from '../../src/entities/organization.entity';
import { OrganizationService } from '../../src/organization/organization.service';
import { OrderStatus } from '../../src/order/order-status.enum';
import { Order } from '../../src/entities/order.entity';

interface OrderUserPair {
  order: Order;
  user: User;
}

export class OrderMock {
  private locationService: LocationService;
  private orderService: OrderService;
  private productService: ProductService;
  private userService: UserService;
  private organizationService: OrganizationService;

  constructor(private readonly module: TestingModule) {
    this.orderService = module.get<OrderService>(OrderService);
    this.organizationService = module.get<OrganizationService>(
      OrganizationService,
    );
    this.locationService = module.get<LocationService>(LocationService);
    this.productService = module.get<ProductService>(ProductService);
    this.userService = module.get<UserService>(UserService);
  }

  async generate() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000; // 200 seconds
    // requires UserMock and LocationMock
    const users = await this.getVerifiedUsers();
    if (!users || !users.length) {
      log.warn('No mock uses are verified - no mock orders will be created.');
    }
    const organizations = await this.getOrganizations();
    for (const org of organizations) {
      const fullLocations = await this.locationService.findWithFilter({
        limit: 2,
        organizationId: org.id,
      });
      for (const location of fullLocations[0]) {
        if (location.hoursToday && location.hoursToday.isOpen) {
          const products = await this.getLocationProducts(location.id);
          if (!_.isEmpty(products)) {
            const orderAndUsers: OrderUserPair[] = [];
            // one order per user per location
            // orders are created automatically when adding products to cart

            for (const user of users) {
              let order = await this.orderService.getCart(user.id);
              if (!order || (order && order.location.id === location.id)) {
                // wrap in try catch so users with open cart are skipped
                try {
                  let maxInCart = 0; // implement max number of products to lessen timeout
                  for (const product of products) {
                    if (maxInCart >= 5) {
                      break;
                    }
                    const orderProducts = await this.setupOrderProducts(
                      user,
                      product,
                    );
                    maxInCart++;
                  }

                  // submit promises so that we can order at next location
                  order = await this.orderService.getCart(user.id);
                  orderAndUsers.push({ order, user });
                } catch (error) {
                  log.error(error);
                }
              }
            }
            // We've collected all submit promises, let's resolve them
            await this.submitOrders(orderAndUsers);
            await this.modifyStatuses(orderAndUsers);
          }
        }
      }
    }
  }

  async getVerifiedUsers() {
    const users = await this.userService.findWithFilter(
      { 'user.id': 'ASC' },
      20,
      0,
      '%%',
    );
    // Create mocks for users that are allowed to order
    // To test invalid users, seed them in your test separately.

    const verifiedUsers = (users[0] as User[]).filter(
      u => u.verified && u.mobileNumber,
    );
    return new Promise<User[]>(resolve => resolve(verifiedUsers as User[]));
  }
  async getOrganizations() {
    const organizations = await this.organizationService.findWithFilter({
      limit: 10,
      includeLocations: true,
    });
    return organizations[0] as Organization[];
  }

  async getLocationProducts(locationId) {
    const products = await this.productService.findWithFilter({ locationId });
    return new Promise<Product[]>(resolve => resolve(products[0] as Product[]));
  }

  async setupOrderProducts(
    user: User,
    product: Product,
  ): Promise<OrderProduct[]> {
    const orderProducts: OrderProduct[] = [];
    let orderProduct = new OrderProduct();
    const { weightPrices } = product.pricing || { weightPrices: null };
    if (product.pricing && product.isInStock) {
      if (!_.isEmpty(weightPrices)) {
        // add order per weight price
        for (const weightPrice of weightPrices) {
          if (weightPrice.price) {
            const opWeight = await this.orderService.addProductWeightToCart(
              user.id,
              weightPrice.id,
            );
            orderProducts.push(opWeight);
          }
        }
      } else if (product.pricing.price) {
        // add order for product if has price
        orderProduct = await this.orderService.addProductToCart(
          user.id,
          product.id,
        );
        orderProducts.push(orderProduct);
      }
    }

    // adding products will automatically create/use the user's existing order/cart at product's location
    return new Promise<OrderProduct[]>(resolve =>
      resolve(orderProducts as OrderProduct[]),
    );
  }

  async submitOrders(orderAndUsers: OrderUserPair[]) {
    const submits = orderAndUsers.map(({ order, user }) => {
      // log.info(`Submitting: ${order.id} by ${user.firstName} ${user.lastName}`);
      return this.orderService.submitOrder(order.id, user.id);
    });
    return Promise.all(submits);
  }
  async modifyStatuses(orderAndUsers: OrderUserPair[]) {
    const updates = orderAndUsers.map(({ order, user }) => {
      let orderStatus: OrderStatus = null;
      switch (user.email) {
        case 'user+open@isbx.com':
          orderStatus = OrderStatus.OPEN;
          break;
        case 'user+submitted@isbx.com':
          orderStatus = OrderStatus.SUBMITTED;
          break;
        case 'user+completed@isbx.com':
          orderStatus = OrderStatus.COMPLETED;
          break;
        case 'user+cancelled@isbx.com':
          orderStatus = OrderStatus.CANCELLED;
          break;
      }

      if (orderStatus) {
        return this.orderService.updateOrderStatus(
          order.id,
          orderStatus,
          user.id,
        );
      } else return null;
    });
    return Promise.all(updates);
  }
}
