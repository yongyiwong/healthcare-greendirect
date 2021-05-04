import faker from 'faker';
import { TestingModule } from '@nestjs/testing';
import * as _ from 'lodash';

import { FREEWAY_ORGANIZATIONS } from './location.mock';
import { MOBILE_NUMBERS } from './data/mobile-number.data';
import { PATIENT_NUMBERS } from './data/patient-number.data';
import { MOCK_USERS } from './data/user.data';
import { FixtureService } from '../utils/fixture.service';
import { FreewayUser } from '../../src/entities/freeway-user.entity';
import { FreewayUserIdentification } from '../../src/entities/freeway-user-identification.entity';
import {
  OrganizationPOSId,
  FreewayUserDto,
} from '../../src/user/freeway-user/freeway-user.dto';
import { FreewayUserPhone } from '../../src/entities/freeway-user-phone.entity';
import { UserIdentificationType } from '../../src/user/freeway-user/freeway-user.dto';

export const MOCK_FREEWAY_USER = [
  {
    email: 'isbxmail+freeway_1@gmail.com',
    posId: 5023696,
    firstName: faker.name.firstName(),
    middleName: 'J',
    lastName: faker.name.lastName(),
    gender: 'female',
    birthday: '1982-09-06',
    active: true,
    primaryFacility: 3227,
    type: 'medical',
    orderCountWeek: 2,
    orderCountMonth: 2,
    orderCountNinety: 2,
    totalPoints: 69,
    totalOrders: 2,
    totalSpent: '76.71',
    favoriteEdible: 'Real Fruit Gummies - Guanabana 1:1',
    favoriteEdibleId: 3730036,
    orgId: OrganizationPOSId.BFriends,
    ids: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        idNumber: PATIENT_NUMBERS[19],
        type: UserIdentificationType.MED,
        active: true,
      },
    ] as FreewayUserIdentification[],
    phoneNumbers: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        type: 'default',
        number: MOBILE_NUMBERS[20],
        active: true,
        sms: false,
      } as FreewayUserPhone,
    ],
  },
  {
    email: 'isbxmail+freeway_2@gmail.com',
    posId: 5024161,
    firstName: faker.name.firstName(),
    middleName: 'J',
    lastName: faker.name.lastName(),
    birthday: '1990-02-19',
    active: true,
    type: 'medical',
    orderCountWeek: 1,
    orderCountMonth: 1,
    orderCountNinety: 1,
    totalPoints: 25,
    totalOrders: 1,
    totalSpent: '27.88',
    favoriteFlower: 'Desfran',
    favoriteFlowerId: 3720812,
    orgId: OrganizationPOSId.BFriends,
    ids: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        idNumber: PATIENT_NUMBERS[20],
        type: UserIdentificationType.MED,
        active: true,
      },
    ] as FreewayUserIdentification[],
    phoneNumbers: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        type: 'default',
        number: MOBILE_NUMBERS[21],
        active: true,
        sms: false,
      } as FreewayUserPhone,
    ],
  },
  {
    email: 'isbxmail+freeway_3@gmail.com',
    posId: 6135272,
    firstName: faker.name.firstName(),
    middleName: 'J',
    lastName: faker.name.lastName(),
    birthday: '1990-02-19',
    active: true,
    type: 'medical',
    orderCountWeek: 1,
    orderCountMonth: 1,
    orderCountNinety: 1,
    totalPoints: 25,
    totalOrders: 1,
    totalSpent: '27.88',
    favoriteFlower: 'Desfran',
    favoriteFlowerId: 3720812,
    orgId: OrganizationPOSId.BFriends,
    ids: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        idNumber: PATIENT_NUMBERS[21],
        type: UserIdentificationType.MED,
        active: true,
      },
    ] as FreewayUserIdentification[],
    phoneNumbers: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        type: 'default',
        number: MOBILE_NUMBERS[22],
        active: true,
        sms: false,
      } as FreewayUserPhone,
    ],
  },
  {
    email: 'isbxmail+freeway_4@gmail.com',
    posId: 6135273,
    firstName: faker.name.firstName(),
    middleName: faker.name.lastName(),
    lastName: faker.name.lastName(),
    birthday: '1990-02-19',
    active: true,
    type: 'medical',
    orderCountWeek: 1,
    orderCountMonth: 1,
    orderCountNinety: 1,
    totalPoints: 25,
    totalOrders: 1,
    totalSpent: '27.88',
    favoriteFlower: 'Desfran',
    favoriteFlowerId: 3720812,
    orgId: OrganizationPOSId.BFriends,
    ids: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        idNumber: PATIENT_NUMBERS[22],
        type: UserIdentificationType.MED,
        active: true,
      },
    ] as FreewayUserIdentification[],
    phoneNumbers: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        type: 'default',
        number: MOBILE_NUMBERS[23],
        active: true,
        sms: false,
      } as FreewayUserPhone,
    ],
  },
  {
    email: 'isbxmail+freeway_5@gmail.com',
    posId: 6135274,
    firstName: faker.name.firstName(),
    middleName: faker.name.lastName(),
    lastName: faker.name.lastName(),
    birthday: '1990-02-19',
    active: true,
    type: 'medical',
    orderCountWeek: 1,
    orderCountMonth: 1,
    orderCountNinety: 1,
    totalPoints: 25,
    totalOrders: 1,
    totalSpent: '27.88',
    favoriteFlower: 'Desfran',
    favoriteFlowerId: 3720812,
    orgId: OrganizationPOSId.BFriends,
    ids: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        idNumber: PATIENT_NUMBERS[23],
        type: UserIdentificationType.MED,
        active: true,
      },
    ] as FreewayUserIdentification[],
    phoneNumbers: [
      {
        posId: faker.random.number({
          min: 100,
          max: 200,
        }),
        orgId: OrganizationPOSId.BFriends,
        type: 'default',
        number: MOBILE_NUMBERS[24],
        active: true,
        sms: false,
      } as FreewayUserPhone,
    ],
  },
];

export class FreewayUserMock {
  private fixtureService: FixtureService;

  constructor(private readonly module: TestingModule) {
    this.fixtureService = module.get<FixtureService>(FixtureService);
  }

  async generate() {
    await this.setupFreewayUsers();
  }

  async setupFreewayUsers() {
    const userMocks = _.flatten(
      MOCK_USERS.map(user => {
        // Create record on each organization
        const { BFriends, ClinicaVerde } = OrganizationPOSId;
        return _.flatten(
          [BFriends, ClinicaVerde].map(
            orgPOS =>
              ({
                posId: faker.random.number({ min: 100, max: 200 }),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                active: true,
                totalPoints: faker.random.number({ min: 0, max: 2050 }),
                orgId: Number(orgPOS),
              } as FreewayUserDto),
          ),
        );
        // TODO add other freeway table one-to-many joins?
      }),
    );

    for (const fwUser of [...userMocks, ...MOCK_FREEWAY_USER]) {
      await this.fixtureService.saveEntityUsingValues(FreewayUser, fwUser);
    }
  }
}
