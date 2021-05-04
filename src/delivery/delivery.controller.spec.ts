import { Test } from '@nestjs/testing';

import { AppModule } from '../app.module';
import { Delivery, DeliveryStatus } from '../entities/delivery.entity';
import { User } from '../entities/user.entity';
import { LocationService } from '../location';
import { OrderService } from '../order/order.service';
import { UserService } from '../user/user.service';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';

describe('DeliveryController', () => {
  let deliveryService: DeliveryService;
  let deliveryController: DeliveryController;
  let userService: UserService;
  let locationService: LocationService;
  let orderService: OrderService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    deliveryService = module.get<DeliveryService>(DeliveryService);
    deliveryController = module.get<DeliveryController>(DeliveryController);
    userService = module.get<UserService>(UserService);
    locationService = module.get<LocationService>(LocationService);
    orderService = module.get<OrderService>(OrderService);
  });

  describe('Delivery Unit Tests Happy Path', () => {
    let admin;
    let driver;
    let location;
    beforeAll(async () => {
      admin = await userService.findByEmail('admin_e2e@isbx.com');
      driver = await userService.findByEmail('gd_driver@isbx.com');
      location = await locationService.findById(6);
    });

    describe('DeliveryController#update', () => {
      it('should call DeliveryService#updateDeliveryStatus', async () => {
        const deliveryBody = {
          location,
          orders: [],
        };
        const newDelivery = await deliveryService.createDelivery(
          admin.id,
          deliveryBody,
          admin.id,
        );
        newDelivery.deliveryStatus = DeliveryStatus.CANCELLED;
        const spy = jest
          .spyOn(deliveryService, 'updateDeliveryStatus')
          .mockImplementation(
            async (adminUser: User, delivery: Delivery) => newDelivery,
          );
        await deliveryController.update(admin, 1, newDelivery);
        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
