import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import supertest from 'supertest';
import { UserController, UserService } from '../src/user';
import { Location } from '../src/entities/location.entity';
import { JwtToken, LoginDto } from '@sierralabs/nest-identity';
import { LocationService } from '../src/location/location.service';
import * as _ from 'lodash';
import { UserMock } from './mocks/user.mock';
import { LocationMock } from './mocks/location.mock';
import { User } from '../src/entities/user.entity';
import { SaveUserLocationsDto } from '../src/user-location/dto/save-user-locations.dto';

const dateTest = new Date('01 Jan 1970 00:00:00 GMT'); // used for testing

function getLocation(): Location {
  const location = {
    name: 'PopularLocation-' + new Date().valueOf(),
    city: 'Los Angeles',
    postalCode: '90034',
    phoneNumber: '3101235555',
    created: dateTest,
    createdBy: 1,
    modified: dateTest,
    modifiedBy: 1,
    thumbnail: 'https://placekitten.com/100/100',
    organization: {
      id: 1,
    },
  };
  return location as Location;
}

function getUser(): User {
  const ts = new Date().valueOf();
  const newUser = new User();
  newUser.firstName = 'John';
  newUser.lastName = 'Doe-' + ts;
  newUser.email = 'isbxmail+' + ts + '@gmail.com';
  newUser.password = 'password';
  newUser.created = dateTest;
  newUser.createdBy = 1;
  newUser.modified = dateTest;
  newUser.modifiedBy = 1;
  return newUser;
}

// increase timeout for tests when executing on AWS
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
describe('UserLocations (e2e)', () => {
  let app: INestApplication;
  let server: supertest.SuperTest<supertest.Test>;
  let userController: UserController;
  let userService: UserService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    app.close();
  });

  describe('Admin User', () => {
    let jwtToken: JwtToken;
    let newLocation: Location;
    let newUser: User;

    beforeAll(async () => {
      const dto = {
        email: 'admin_e2e@isbx.com',
        password: 'password',
      } as LoginDto;
      jwtToken = await userController.login(dto);
    });

    // new location
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

    // new user
    it('/POST /user', async () => {
      const response = await server
        .post('/users')
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .send(getUser())
        .expect(201);
      expect(response.body).toHaveProperty('id');
      newUser = response.body;
    });

    it('PUT /users/:id/locations', async () => {
      // assign user to location
      const response = await server
        .put('/users/' + newUser.id + '/locations')
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .send({
          assignments: [newLocation.id],
        } as SaveUserLocationsDto)
        .expect(200);
    });

    it('GET /locations/:id/users', async () => {
      const response = await server
        .get('/locations/' + newLocation.id + '/users')
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toBeInstanceOf(Array); // list
      expect(response.body[1]).toBeGreaterThan(0); // count
    });
  });
});
