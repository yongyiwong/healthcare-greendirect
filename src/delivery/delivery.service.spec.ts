import { Test } from '@nestjs/testing';
import { def, get } from 'bdd-lazy-var';

import { AppModule } from '../app.module';
import { Delivery, DeliveryStatus } from '../entities/delivery.entity';
import { Order } from '../entities/order.entity';
import { LocationService } from '../location';
import { OrderService } from '../order/order.service';
import { UserService } from '../user/user.service';
import { DeliveryExceptions } from './delivery.exceptions';
import { DeliveryService } from './delivery.service';

describe('DeliveryService', () => {
  let deliveryService: DeliveryService;
  let userService: UserService;
  let locationService: LocationService;
  let orderService: OrderService;

  let admin;
  let driver;
  let location;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    deliveryService = module.get<DeliveryService>(DeliveryService);
    userService = module.get<UserService>(UserService);
    locationService = module.get<LocationService>(LocationService);
    orderService = module.get<OrderService>(OrderService);

    admin = await userService.findByEmail('admin_e2e@isbx.com');
    driver = await userService.findByEmail('gd_driver@isbx.com');
    location = await locationService.findById(6);
  });

  def('user', () => admin);
  def('assignedDriverId', () => null);
  def('deliveryBody', () => ({ ...new Delivery(), location, orders: [] })); // no orders for now
  def('delivery', async () =>
    deliveryService.createDelivery(
      get('user').id,
      get('deliveryBody'),
      get('assignedDriverId'),
    ),
  );

  describe('getDeliveries', () => {
    beforeEach(async () => {
      // create a delivery
      await get('delivery');
    });

    def('subject', async () => {
      return deliveryService.getDeliveries(get('user'), null);
    });

    it('returns deliveries', async () => {
      const [deliveries, count] = await get('subject');
      expect(count).toBeGreaterThan(0);
    });

    describe('when user is DRIVER', () => {
      def('user', () => driver);
      def('assignedDriverId', () => driver.id);

      it('returns own deliveries only', async () => {
        const [deliveries, count] = await get('subject');
        expect(count).toBeGreaterThan(0);
        expect(deliveries).toEqual(
          expect.arrayContaining([
            expect.not.objectContaining({ driverUser: { id: driver.id } }),
          ]),
        );
      });
    });
  });

  describe('createDelivery', () => {
    def('subject', async () =>
      deliveryService.createDelivery(
        get('user').id,
        get('deliveryBody'),
        get('assignedDriverId'),
      ),
    );

    it('creates delivery', async () => {
      const newDelivery = await get('subject');
      expect(newDelivery).toHaveProperty('id');
      expect(newDelivery).toHaveProperty('deliveryStatus', DeliveryStatus.OPEN);
    });

    describe('with assigned driver', () => {
      def('assignedDriverId', () => driver.id);

      it('creates delivery', async () => {
        const newDelivery = await get('subject');
        expect(newDelivery).toHaveProperty('driverUser.id', driver.id);
      });
    });
  });

  describe('getOne', () => {
    def('subject', async () => {
      const newDelivery = await get('delivery');
      return deliveryService.getOne(get('user'), newDelivery.id);
    });

    it('returns one delivery', async () => {
      const delivery = await get('subject');
      expect(delivery).toBeInstanceOf(Delivery);
    });

    describe('when user is DRIVER', () => {
      def('user', () => driver);

      describe('when delivery is assigned to driver', () => {
        def('assignedDriverId', () => get('user').id);

        it('returns one delivery', async () => {
          const delivery = await get('subject');
          expect(delivery).toHaveProperty('driverUser.id', get('user').id);
        });
      });

      describe('when delivery is not assigned to driver', () => {
        def('assignedDriverId', () => null);

        it('returns undefined', async () => {
          const delivery = await get('subject');
          expect(delivery).toBeUndefined();
        });
      });
    });
  });

  describe('updateDeliveryStatus', () => {
    def('deliveryStatus', () => DeliveryStatus.CANCELLED);
    def('subject', async () => {
      const newDelivery = await get('delivery');
      const updateDeliveryBody = {
        id: newDelivery.id,
        deliveryStatus: get('deliveryStatus'),
        modifiedBy: get('user').id,
      };
      return deliveryService.updateDeliveryStatus(
        get('user'),
        updateDeliveryBody,
      );
    });

    it('updates delivery status', async () => {
      const updatedDelivery = await get('subject');
      expect(updatedDelivery).toHaveProperty(
        'deliveryStatus',
        get('deliveryStatus'),
      );
    });

    describe('when user is DRIVER', () => {
      def('user', () => driver);

      describe('when assigned to driver', () => {
        def('assignedDriverId', () => get('user').id);

        it('updates delivery status', async () => {
          const updatedDelivery = await get('subject');
          expect(updatedDelivery).toHaveProperty(
            'deliveryStatus',
            get('deliveryStatus'),
          );
        });
      });

      describe('when not assigned to driver', () => {
        def('assignedDriverId', () => null);

        it('throws driverNotAssignedToDelivery exception', async () => {
          return expect(get('subject')).rejects.toThrow(
            DeliveryExceptions.driverNotAssignedToDelivery.message,
          );
        });
      });
    });
  });

  describe('addDriverToDelivery', () => {
    def('assignedDriverId', () => driver.id);

    it('adds driver to delivery', async () => {
      const user = get('user');
      const delivery = await get('delivery');

      await deliveryService.addDriverToDelivery(
        user.id,
        delivery.id,
        get('assignedDriverId'),
      );

      const updatedDelivery = await deliveryService.getOne(user, delivery.id);
      expect(updatedDelivery).toHaveProperty('driverUser.id', driver.id);
    });
  });

  describe('addOrderToDelivery', () => {
    it('adds order to delivery', async () => {
      const user = get('user');
      const delivery = await get('delivery');

      await deliveryService.addOrderToDelivery(user.id, delivery.id, 3);

      const updatedDelivery = await deliveryService.getOne(user, delivery.id);
      expect(updatedDelivery).toEqual(
        expect.objectContaining({
          orders: expect.arrayContaining([expect.objectContaining({ id: 3 })]),
        }),
      );
    });
  });

  describe('removeOrderFromDelivery', () => {
    it('removes order from delivery', async () => {
      // create a delivery with an order
      const user = get('user');
      // create order
      const order = await orderService.create({
        ...new Order(),
        user: get('user'),
        location: location.id,
      });
      const delivery = await get('delivery');
      await deliveryService.addOrderToDelivery(user.id, delivery.id, order.id);

      await deliveryService.removeOrderFromDelivery(
        admin.id,
        delivery.id,
        order.id,
      );

      const updatedDelivery = await deliveryService.getOne(user, delivery.id);
      expect(updatedDelivery).toEqual(
        expect.objectContaining({
          orders: expect.not.arrayContaining([
            expect.objectContaining({
              id: order.id,
            }),
          ]),
        }),
      );

      const updatedOrder = await orderService.getOrder(order.id, user.id, true);
      expect(updatedOrder.delivery).toBeUndefined();
    });
  });

  describe('setReceivedAmountToOrder', () => {
    def('receivedAmount', () => 120.5);
    def('note', () => 'Just ignore the dog.');
    def('subject', async () => {
      // create order
      const order = await orderService.create({
        ...new Order(),
        user: get('user'),
        location: location.id,
      });
      // create delivery, assign order here
      const delivery = await deliveryService.createDelivery(
        get('user').id,
        { ...new Delivery(), location, orders: [order.id] },
        get('assignedDriverId'),
      );
      // then update the order status
      const updateOrderBody = {
        orderId: order.id,
        receivedAmount: get('receivedAmount'),
        note: get('note'),
        createdBy: get('user').id,
      };
      await deliveryService.setReceivedAmountToOrder(
        get('user'),
        delivery.id,
        order.id,
        updateOrderBody,
      );

      return orderService.getOrder(order.id, get('user').id, true);
    });

    it('sets received amount to order', async () => {
      const order = await get('subject');
      expect(order).toHaveProperty('receivedAmount', get('receivedAmount'));
      expect(order).toHaveProperty('note', get('note'));
    });

    describe('when user is DRIVER', () => {
      def('user', () => driver);
      def('receivedAmount', () => 150.99);

      describe('when assigned to delivery of order', () => {
        def('assignedDriverId', () => get('user').id);

        it('sets received amount to order', async () => {
          const order = await get('subject');
          expect(order).toHaveProperty('receivedAmount', get('receivedAmount'));
        });
      });

      describe('when not assigned to delivery of order', () => {
        def('assignedDriverId', () => null);

        it('throws driverNotAssignedToDelivery exception', async () => {
          return expect(get('subject')).rejects.toThrow(
            DeliveryExceptions.driverNotAssignedToDelivery.message,
          );
        });
      });
    });
  });
});
