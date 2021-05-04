import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { def, get } from 'bdd-lazy-var';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { Delivery } from '../src/entities/delivery.entity';
import { Location } from '../src/entities/location.entity';
import { Organization } from '../src/entities/organization.entity';
import { UserAddress } from '../src/entities/user-address.entity';
import { UserRole } from '../src/entities/user-role.entity';
import { User } from '../src/entities/user.entity';
import { OrderUpdateDeliveryDto } from '../src/order/dto/order-search.dto';
import { OrderService } from '../src/order/order.service';
import { RoleEnum } from '../src/roles/roles.enum';
import { RolesService } from '../src/roles/roles.service';
import { UserService } from '../src/user';
import * as Fixtures from './fixtures';
import { FixtureService } from './utils/fixture.service';
import { TestUtilsModule } from './utils/test-utils.module';
import { LoginDto } from '@sierralabs/nest-identity';

const ADMIN = { userId: 1, email: 'admin_e2e@isbx.com' };
jasmine.DEFAULT_TIMEOUT_INTERVAL = 65000;
describe('Delivery_API', () => {
  let app: INestApplication;
  let server: supertest.SuperTest<supertest.Test>;
  let fixtureService: FixtureService;
  let orderService: OrderService;
  let rolesService: RolesService;
  let userService: UserService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, TestUtilsModule],
    }).compile();

    fixtureService = module.get<FixtureService>(FixtureService);
    orderService = module.get<OrderService>(OrderService);
    rolesService = module.get<RolesService>(RolesService);
    userService = module.get<UserService>(UserService);

    app = module.createNestApplication();
    await app.init();

    server = supertest(app.getHttpServer());
  });

  def('jwtToken', async () => {
    // const admin = await userService.findByEmail('admin_e2e@isbx.com');
    const token = await userService.login(ADMIN.email, 'password');
    return token.accessToken;
  });

  def('organization', async () =>
    fixtureService.saveEntityUsingValues(Organization),
  );

  def('location', async () => {
    const organization = await get('organization');
    const location = await fixtureService.saveEntityUsingValues(Location, {
      organization: { id: organization.id },
      products: [new Fixtures.ProductFixture()],
    });
    return location;
  });

  def('patient', async () => {
    const user = await fixtureService.saveEntityUsingValues(User);
    // set role
    const role = await rolesService.findByName(RoleEnum.Patient);
    await fixtureService.saveEntityUsingValues(UserRole, {
      user: { id: user.id },
      role: { id: role.id },
    });
    return user;
  });

  def('driver', async () => {
    const user = await fixtureService.saveEntityUsingValues(User);
    const role = await rolesService.findByName(RoleEnum.Driver);
    await fixtureService.saveEntityUsingValues(UserRole, {
      user: { id: user.id },
      role: { id: role.id },
    });
    return user;
  });

  def('order', async () => {
    const location = await get('location');
    const patient = await get('patient');
    const userAddress = await fixtureService.saveEntityUsingValues(
      UserAddress,
      {
        userId: patient.id,
      },
    );
    await orderService.addProductWeightToCart(
      patient.id,
      location.products[0].pricing.weightPrices[0].id,
    );
    const cart = await orderService.getCart(patient.id);
    await orderService.setOrderDelivery(
      cart.id,
      {
        id: cart.id,
        isDelivery: true,
        userAddressId: userAddress.id,
      } as OrderUpdateDeliveryDto,
      patient.id,
    );
    await orderService.submitOrder(cart.id, patient.id);
    const order = await orderService.getOrder(cart.id, patient.id);
    return order;
  });

  def('delivery', async () => {
    const driver = await get('driver');
    const order = await get('order');
    return fixtureService.saveEntityUsingValues(Delivery, {
      location: { id: order.location.id },
      driverUser: { id: driver.id },
      orders: [{ id: order.id }],
      createdBy: ADMIN.userId,
      created: new Date(),
      modifiedBy: ADMIN.userId,
      modified: new Date(),
    });
  });

  describe('GET /deliveries', () => {
    def('subject', async () => {
      // create a delivery
      await get('delivery');

      const jwt = await get('jwtToken');
      return server.get('/deliveries').set('Authorization', 'bearer ' + jwt);
    });

    it('gets successfully', async () => {
      const response = await get('subject');

      expect(response.status).toBe(200);

      const [_deliveries, count] = response.body;
      expect(count).toBeTruthy();
    });

    describe('when not logged in', () => {
      def('jwtToken', () => null);

      it('returns http status code 403', async () => {
        const response = await get('subject');

        expect(response.status).toBe(403);
      });
    });

    xit('only allow site admins and employees to view deliveries on their assigned locations', () => {});
  });
  describe('GET /deliveries/{deliveryId}', () => {
    xit('gets successfully', () => {});
    xit('only allow site admins and employees to view a delivery on their assigned locations', () => {});
    xit('only allows drivers to view a delivery assigned to them', () => {});
  });
  describe('POST /deliveries', () => {
    xit('creates successfully', () => {});
  });

  describe('PUT /deliveries/{deliveryId}', () => {
    xit('updates successfully', () => {});
    xit('only allow site admins and employees to update orders on their assigned locations', () => {});
    xit('only allows drivers to update orders assigned to them', () => {});
  });
  describe('POST /deliveries/{deliveryId}/driver/{userId}', () => {
    xit('posts successfully', () => {});
    xit('only allow site admins and employees to update orders on their assigned locations', () => {});
  });
  describe('DELETE /deliveries/{deliveryId}/driver/{userId}', () => {
    xit('deletes successfully', () => {});
    xit('only allow site admins and employees to update orders on their assigned locations', () => {});
  });
  describe('PUT /deliveries/{deliveryId}/driver/{userId}', () => {
    xit('updates successfully', () => {});
    xit('only allow site admins and employees to update orders on their assigned locations', () => {});
    xit('only allows drivers to update orders assigned to them', () => {});
  });
});
