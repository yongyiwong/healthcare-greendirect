import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtToken, LoginDto } from '@sierralabs/nest-identity';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { Order } from '../src/entities/order.entity';
import { LocationService } from '../src/location/location.service';
import { OrderService } from '../src/order/order.service';
import { UserController, UserService } from '../src/user';
import { OrderMock } from './mocks/order.mock';
import { OrganizationService } from '../src/organization/organization.service';
import { UserMock } from './mocks/user.mock';
import { LocationMock } from './mocks/location.mock';

// increase timeout for tests when executing on AWS
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let server: supertest.SuperTest<supertest.Test>;
  let userController: UserController;
  let locationService: LocationService;
  let userService: UserService;
  let orderService: OrderService;
  let organizationService: OrganizationService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    locationService = module.get<LocationService>(LocationService);
    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    organizationService = module.get<OrganizationService>(OrganizationService);

    userService.onModuleInit();

    app = module.createNestApplication();
    await app.init();

    server = supertest(app.getHttpServer());

    /**
     * Temporarily skip seeding to prevent conflicts with mocks
     * Use `npm run test:mocks` to load data before running tests.
     */
    const userMock = new UserMock(module);
    await userMock.generate();

    const locationMock = new LocationMock(module);
    await locationMock.generate();

    // const orderMock = new OrderMock(module);
    // await orderMock.generate();
  });

  afterAll(async () => {
    app.close();
  });

  describe('Orders', async () => {
    let jwtToken: JwtToken;
    let order = new Order();

    beforeAll(async () => {
      const loginDto = {
        email: 'user_e2e@isbx.com',
        password: 'password',
      } as LoginDto;
      jwtToken = await userController.login(loginDto);
    });

    it('GET /orders (search)', async () => {
      const response = await server
        .get('/orders')
        .query({ search: 'order', order: 'locationName ASC' })
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(200);
      expect(response.body[0]).toBeInstanceOf(Array);
      order = response.body[0][0];
    });

    it('GET /orders/:id', async () => {
      const response = await server
        .get('/orders/' + order.id)
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(200);
    });

    it('GET /orders/cart', async () => {
      const response = await server
        .get('/orders/cart')
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(200);
    });

    // NOTE: before enabling, make sure this will not conflict with
    // other Cart tests due to the "only one open order per user" rule.
    xit('POST /orders/:id/submit', async () => {
      const response = await server
        .post('/orders/' + order.id + '/submit')
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(201);
    });
  });
});
