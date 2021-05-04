import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import supertest from 'supertest';
import { User } from '../src/entities/user.entity';
import { UserService } from '../src/user/user.service';
import { RolesService } from '../src/roles/roles.service';
import { Role } from '../src/entities/role.entity';
import * as _ from 'lodash';

import { JwtToken } from '@sierralabs/nest-identity';
import { UserMock } from './mocks/user.mock';

// increase timeout for tests when executing on AWS
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
describe('UserController (e2e)', () => {
  let app: INestApplication;
  let server: supertest.SuperTest<supertest.Test>;
  let jwtToken: JwtToken;

  let userService: UserService;
  let rolesService: RolesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userService = module.get<UserService>(UserService);
    rolesService = module.get<RolesService>(RolesService);

    app = module.createNestApplication();
    await app.init();

    server = supertest(app.getHttpServer());

    const userMock = new UserMock(module);
    await userMock.generate();
  });

  afterAll(async () => {
    app.close();
  });

  describe('Admin User', () => {
    it('/POST /users/login', async () => {
      const response = await server
        .post('/users/login')
        .send({
          email: 'admin_e2e@isbx.com',
          password: 'password',
        })
        .expect(201);

      // response.body.should.include('accessToken');
      jwtToken = response.body;
    });

    it('/POST /users/login', async () => {
      const response = await server
        .post('/users/login')
        .send({
          email: 'test@gmail.com',
          password: 'password2',
        })
        .expect(401);
    });

    it('/GET /users', async () => {
      const response = await server
        .get('/users')
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(200);
    });

    it('/PUT /users should allow partial update', async () => {
      const response = await server
        .put('/users/1')
        .send({
          patientId: 'PA-12312',
        })
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(200);
    });

    xit('should fail to create user with duplicate email', async () => {});

    it('/PUT /users should allow updating deleted', async () => {
      const response = await server
        .put('/users/1')
        .send({ deleted: true })
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(200);

      expect(response.body.deleted).toEqual(true);
    });
  });

  describe('Normal User', () => {
    it('/POST /users/login', async () => {
      const response = await server
        .post('/users/login')
        .send({
          email: 'user_e2e@isbx.com',
          password: 'password',
        })
        .expect(201);

      jwtToken = response.body;
      expect(jwtToken).toHaveProperty('accessToken');
    });

    it('/GET /users', async () => {
      // jwtToken = { accessToken: '' };
      const response = await server
        .get('/users')
        .set('Authorization', 'bearer ' + jwtToken.accessToken)
        .expect(403);
    });
  });
});
