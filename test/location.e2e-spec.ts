import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import supertest from 'supertest';
import { UserController, UserService } from '../src/user';
import { Location } from '../src/entities/location.entity';
import { Product } from '../src/entities/product.entity';
import { JwtToken, LoginDto } from '@sierralabs/nest-identity';
import { LocationService } from '../src/location/location.service';
import { UserMock } from './mocks/user.mock';
import { LocationMock } from './mocks/location.mock';

const dateTest = new Date('01 Jan 1970 00:00:00 GMT'); // used for testing

function getLocation(): Location {
  const location = {
    id: 1,
    name: 'Test Location (e2e)',
    addressLine1: '123 Main st.',
    addressLine2: 'Ste 1250',
    city: 'Los Angeles',
    // state, // TODO: fill in state
    postalCode: '90034',
    phoneNumber: '3101235555',
    created: dateTest,
    createdBy: 1,
    modified: dateTest,
    modifiedBy: 1,
    thumbnail: 'https://placekitten.com/200/200',
    organization: {
      id: 1,
    },
  };
  return location as Location;
}

function getProduct(): Product {
  const product = new Product();
  product.name = 'Product Test (e2e location test)';
  product.description = 'This is a test product for e2e testing.';
  product.pricingType = 'weight';
  product.isInStock = true;
  product.created = dateTest;
  product.createdBy = 1;
  product.modified = dateTest;
  product.modifiedBy = 1;
  return product;
}

// increase timeout for tests when executing on AWS
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
describe('LocationController (e2e)', () => {
  let app: INestApplication;
  let server: supertest.SuperTest<supertest.Test>;
  let userController: UserController;
  let locationService: LocationService;
  let userService: UserService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    locationService = module.get<LocationService>(LocationService);
    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    userService.onModuleInit();

    app = module.createNestApplication();
    await app.init();

    server = supertest(app.getHttpServer());

    // Make sure test users exist
    const userMock = new UserMock(module);
    await userMock.generate();

    // Load location mock data
    const locationMock = new LocationMock(module);
    await locationMock.generate();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin User', () => {
    let jwtToken: JwtToken;
    let newLocation: Location;
    let newProduct: Product;

    beforeAll(async () => {
      const loginDto = {
        email: 'admin_e2e@isbx.com',
        password: 'password',
      } as LoginDto;
      jwtToken = await userController.login(loginDto);
    });

    it('POST /locations', async () => {
      const location = getLocation();
      const response = await server
        .post('/locations')
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .send(location)
        .expect(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).not.toBe(location.id);
      expect(response.body.created).not.toBe(dateTest);
      expect(response.body.modified).not.toBe(dateTest);
      expect(response.body.createdBy).toBe(jwtToken.user.id);
      expect(response.body.modifiedBy).toBe(jwtToken.user.id);
      newLocation = response.body;
    });

    it('PUT /locations/:id', async () => {
      newLocation.name += ` (${newLocation.id})`;
      newLocation.createdBy = 1; // test to make sure API does not use this value
      newLocation.modifiedBy = 1; // test to make sure API does not use this value
      delete newLocation.allowOffHours;
      const response = await server
        .put('/locations/' + newLocation.id)
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .send(newLocation)
        .expect(200);
      expect(response.body.name).toBe(newLocation.name);
      expect(response.body.created).toBe(newLocation.created);
      // expect(response.body.modified).not.toBe(newLocation.modified);
    });

    it('GET /locations (getAll without lat/long)', async () => {
      const response = await server
        .get('/locations')
        .query({ search: '(e2e location test)' })
        .expect(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toBeInstanceOf(Array);
      expect(response.body[0].length).toBeGreaterThan(0);
    });
    it('GET /locations (getAll with lat/long)', async () => {
      const response = await server
        .get('/locations')
        .query({
          minLat: 34.021851,
          minLong: -118.426275,
          maxLat: 34.019086,
          maxLong: -118.421937,
        })
        .expect(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toBeInstanceOf(Array);
      expect(response.body[0].length).toBeGreaterThan(2); // based on test data above
    });

    it('GET /locations (search)', async () => {
      const response = await server
        .get('/locations/')
        .query({ search: 'location', order: 'name ASC' })
        .expect(200);
      expect(response.body[0]).toBeInstanceOf(Array);
      let previousName = '';
      response.body[0].forEach((elem, index) => {
        if (index !== 0 && !elem.name) {
          fail('Current element "' + elem.id + '" does not have a "name"');
        }
        expect(elem.name >= previousName).toBeTruthy();
        previousName = elem.name;
      });
    });

    it('POST /locations/:id/products/:productId', async () => {
      const location = getLocation();
      const product = getProduct();

      const response = await server
        .post(`/locations/${location.id}/products`) // status 201
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .send(product)
        .expect(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toBeInstanceOf(Object);
      expect(typeof response.body.id).toBe('number');
      expect(response.body.location.id).toEqual(location.id);
      expect(response.body.id).not.toBe(product.id);
      newProduct = response.body;

      const response2 = await server
        .get(`/locations/${location.id}/products/`)
        .query({ search: 'product', order: 'name ASC' })
        .expect(200);
      expect(response2.body).toBeInstanceOf(Array);
      expect(response2.body[0]).toBeInstanceOf(Array);
      const found = response2.body[0].find(data => {
        return data.id === newProduct.id;
      });
      if (found.id !== newProduct.id) {
        fail(
          'Current product "' + product.id + '" is not contained in the array',
        );
      }
      expect(found.name).toEqual(newProduct.name);
      expect(found.id).toEqual(newProduct.id);
      expect(found.description).toEqual(newProduct.description);
      expect(found.pricingType).toEqual(newProduct.pricingType);
      expect(found.isInStock).toEqual(newProduct.isInStock);
      expect(found.created).toEqual(newProduct.created);
      expect(found.createdBy).toEqual(newProduct.createdBy);
      expect(found.modified).toEqual(newProduct.modified);
      expect(found.modifiedBy).toEqual(newProduct.modifiedBy);
    });
  });
});
