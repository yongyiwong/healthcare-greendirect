import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController, UserService } from '@sierralabs/nest-identity';
import { LocationService } from '../../src/location';
import { OrderService } from '../../src/order/order.service';
import { OrganizationService } from '../../src/organization/organization.service';
import { AppModule } from '../../src/app.module';
import { UserMock } from './user.mock';
import { LocationMock } from './location.mock';
import { OrderMock } from './order.mock';
import { RoleMock } from './role.mock';
import { CouponMock } from './coupon.mock';
import { LocalstackMock } from './localstack.mock';
import { DoctorMock } from './doctor.mock';
import { Connection } from 'typeorm';
import { DealMock } from './deal.mock';
import { TestUtilsModule } from '../utils/test-utils.module';
import { DeliveryMock } from './delivery.mock';
import { BrandMock } from './brand.mock';
import { ProductGroupMock } from './product-group.mock';
import { FreewayUserMock } from './freeway-user.mock';
import { BiotrackUserMock } from './biotrack-user.mock';
import { PromoBannerMock } from './promo-banner.mock';
import { MobileCheckinMock } from './mobile-check-in.mock';
import { SignInLinkMocks } from './sign-in-link.mock';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000;
describe('MockData', () => {
  const logger = new Logger('Mocks');
  const packageInfo = require('../../package.json');
  logger.log(
    `\nEnv     : ${process.env.NODE_ENV}\nVersion : ${packageInfo.version}`,
  );

  let app: INestApplication;
  let module: TestingModule;
  let userController: UserController;
  let locationService: LocationService;
  let userService: UserService;
  let orderService: OrderService;
  let organizationService: OrganizationService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule, TestUtilsModule],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    locationService = module.get<LocationService>(LocationService);
    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    organizationService = module.get<OrganizationService>(OrganizationService);

    userService.onModuleInit();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // close the typeorm connection; otherwise jest won't quit
    const connection = app.get(Connection);
    await connection.close();
    await app.close();
  });

  describe('Load and Check Errors', () => {
    it('should not have mock localstack errors', async () => {
      let error = null;
      try {
        const localstackMock = new LocalstackMock(module);
        await localstackMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock user errors', async () => {
      let error = null;
      try {
        const userMock = new UserMock(module);
        await userMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock freewayuser errors', async () => {
      let error = null;
      try {
        const freewayUserMock = new FreewayUserMock(module);
        await freewayUserMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock biotrack user errors', async () => {
      let error = null;
      try {
        const biotrackUserMock = new BiotrackUserMock(module);
        await biotrackUserMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock doctor errors', async () => {
      let error = null;
      try {
        const doctorMock = new DoctorMock(module);
        await doctorMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock location errors', async () => {
      let error = null;
      try {
        const locationMock = new LocationMock(module);
        await locationMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock role errors', async () => {
      let error = null;
      try {
        const roleMock = new RoleMock(module);
        await roleMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock deal errors', async () => {
      let error = null;
      try {
        const dealMock = new DealMock(module);
        await dealMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock order errors', async () => {
      let error = null;
      try {
        const orderMock = new OrderMock(module);
        await orderMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock brand errors', async () => {
      let error = null;
      try {
        const brandMock = new BrandMock(module);
        await brandMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock product group errors', async () => {
      let error = null;
      try {
        const productGroupMock = new ProductGroupMock(module);
        await productGroupMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock coupon errors', async () => {
      let error = null;
      try {
        const couponMock = new CouponMock(module);
        await couponMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock delivery errors', async () => {
      let error = null;
      try {
        const doctorMock = new DeliveryMock(module);
        await doctorMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock promo-banner errors', async () => {
      let error = null;
      try {
        const bannerMock = new PromoBannerMock(module);
        await bannerMock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock checkin errors', async () => {
      let error = null;
      try {
        const mock = new MobileCheckinMock(module);
        await mock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });

    it('should not have mock sign in link errors', async () => {
      let error = null;
      try {
        const mock = new SignInLinkMocks(module);
        await mock.generate();
      } catch (err) {
        error = err;
        // tslint:disable-next-line:no-console
        console.error('ERROR', err);
        expect(err).toBeFalsy();
      }
      expect(error).toBeFalsy();
    });
  });
});
