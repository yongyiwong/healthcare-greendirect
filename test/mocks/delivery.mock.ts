import { TestingModule } from '@nestjs/testing';
import faker from 'faker';
import { Repository, getRepository, UpdateResult } from 'typeorm';

import { DeliveryService } from '../../src/delivery/delivery.service';
import { CreateDeliveryDto } from '../../src/delivery/dto/create-delivery.dto';
import { OrderService } from '../../src/order/order.service';
import {
  OrderStatus,
  FulfillmentMethod,
} from '../../src/order/order-status.enum';
import { UserService } from '../../src/user/user.service';
import { User } from '../../src/entities/user.entity';
import { DeliveryStatus } from '../../src/entities/delivery.entity';

import { Order } from '../../src/entities/order.entity';
import * as Fixtures from '../fixtures';
import { LocationService } from '../../src/location/location.service';
import { OrganizationPos } from '../../src/entities/organization.entity';

export class DeliveryMock {
  private deliveryService: DeliveryService;
  private orderService: OrderService;
  private userService: UserService;
  private orderRepository: Repository<Order>;
  private locationService: LocationService;

  constructor(private readonly module: TestingModule) {
    this.deliveryService = this.module.get<DeliveryService>(DeliveryService);
    this.orderService = this.module.get<OrderService>(OrderService);
    this.userService = this.module.get<UserService>(UserService);
    this.orderRepository = getRepository<Order>(Order);
    this.locationService = this.module.get<LocationService>(LocationService);
  }

  async generate() {
    await this.addDelivery();
  }

  async updateOrder(id: number, update?: Order): Promise<UpdateResult> {
    return await this.orderRepository.update(
      { id },
      {
        ...new Fixtures.OrderDeliveryFixture(),
        ...update,
      },
    );
  }

  async addDelivery() {
    const orders = await this.orderService.getOrdersByStatus(
      OrganizationPos.Mjfreeway,
      OrderStatus.SUBMITTED,
    );
    const getAdmin = this.userService.findByEmail('admin_e2e@isbx.com');
    const getDriver = this.userService.findByEmail('gd_driver@isbx.com');
    const users = await Promise.all([getAdmin, getDriver]);
    const admin = users[0] as User;
    const driver = users[1] as User;
    let inProgressOrderDelivery: any;

    let limit = 0;
    for (const order of orders) {
      limit++;
      if (limit < 10) {
        const orderData = await this.orderService.getOrder(
          order.id,
          admin.id,
          true,
        );
        const deliveries = await this.deliveryService.createDelivery(
          admin.id,
          orderData as CreateDeliveryDto,
        );

        let updateOrder = {
          delivery: deliveries,
          fullfillmentMethod: FulfillmentMethod.DELIVERY,
        } as Order;

        if (limit < 7) {
          const orderWithDriver = await this.deliveryService.addDriverToDelivery(
            admin.id,
            deliveries.id,
            driver.id,
          );

          orderWithDriver.deliveryStatus =
            limit === 6
              ? DeliveryStatus.CANCELLED
              : limit < 4
              ? DeliveryStatus.IN_PROGRESS
              : DeliveryStatus.DELIVERED;

          const updatedDelivery = this.deliveryService.updateDeliveryStatus(
            admin,
            orderWithDriver,
          );

          if (orderWithDriver.deliveryStatus === DeliveryStatus.IN_PROGRESS) {
            inProgressOrderDelivery = orderWithDriver;
          }

          const orderTotal = order.orderTotal;

          if (orderWithDriver.deliveryStatus === DeliveryStatus.DELIVERED) {
            updateOrder = {
              isPaymentComplete: true,
              orderStatus: OrderStatus.DELIVERED,
              receivedAmount:
                orderTotal + faker.random.number({ min: 0, max: orderTotal }),
              paymentCompletedDate: new Date(),
              note: faker.lorem.sentence(),
              ...updateOrder,
            };
          }

          if (orderWithDriver.deliveryStatus === DeliveryStatus.IN_PROGRESS) {
            updateOrder = {
              ...updateOrder,
              orderStatus: OrderStatus.DELIVERY,
            };
          }

          const updatedOrder = this.updateOrder(order.id, updateOrder);

          await Promise.all([updatedDelivery, updatedOrder]);
        }
      }

      if (limit > 10 && limit < 16) {
        const orderToDelivery = this.deliveryService.addOrderToDelivery(
          admin.id,
          inProgressOrderDelivery.id,
          order.id,
        );

        const updateOrder = this.updateOrder(order.id);

        await Promise.all([orderToDelivery, updateOrder]);
      }
    }
  }
}
