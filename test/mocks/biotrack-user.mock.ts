import faker from 'faker';
import { TestingModule } from '@nestjs/testing';

import { BIOTRACK_ORGANIZATIONS } from './location.mock';
import { FixtureService } from '../utils/fixture.service';
import { BiotrackUser } from '../../src/entities/biotrack-user.entity';
import { OrganizationPOSId } from '../../src/user/freeway-user/freeway-user.dto';
import { MOCK_USERS } from './data/user.data';
import { PATIENT_NUMBERS } from './data/patient-number.data';
import { MOBILE_NUMBERS } from './data/mobile-number.data';

export const MOCK_BIOTRACK_USER = [
  {
    email: 'isbxmail+biotrack_1@gmail.com',
    posId: '0000000000',
    posOrgId: BIOTRACK_ORGANIZATIONS[0].posId,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    birthday: new Date('1678-12-18'),
    medicalNumber: PATIENT_NUMBERS[14],
    medicalExpireDate: new Date('2020-12-01'),
    licenseExpireDate: new Date('1899-12-01'),
    addressLine2: '#1000',
    state: 'CA',
    phoneNumber: MOBILE_NUMBERS[15],
  },
  {
    email: 'isbxmail+biotrack_2@gmail.com',
    posId: 'ee2d25715b',
    posOrgId: BIOTRACK_ORGANIZATIONS[0].posId,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    birthday: new Date('1678-12-18'),
    medicalNumber: PATIENT_NUMBERS[15],
    medicalExpireDate: new Date('2020-12-01'),
    licenseExpireDate: new Date('1899-12-01'),
    addressLine2: '#1000',
    state: 'CA',
    phoneNumber: MOBILE_NUMBERS[16],
  },
  {
    email: 'isbxmail+biotrack_3@gmail.com',
    posId: 'ff3e36826c',
    posOrgId: BIOTRACK_ORGANIZATIONS[0].posId,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    birthday: new Date('1678-12-18'),
    medicalNumber: PATIENT_NUMBERS[15],
    medicalExpireDate: new Date('2020-12-01'),
    licenseExpireDate: new Date('1899-12-01'),
    addressLine2: '#1000',
    state: 'CA',
    phoneNumber: MOBILE_NUMBERS[17],
  },
  {
    email: 'isbxmail+biotrack_4@gmail.com',
    posId: 'ff3e36826d',
    posOrgId: BIOTRACK_ORGANIZATIONS[0].posId,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    birthday: new Date('1678-12-18'),
    medicalNumber: PATIENT_NUMBERS[17],
    medicalExpireDate: new Date('2020-12-01'),
    licenseExpireDate: new Date('1899-12-01'),
    addressLine2: '#1000',
    state: 'CA',
    phoneNumber: MOBILE_NUMBERS[18],
  },
  {
    email: 'isbxmail+biotrack_5@gmail.com',
    posId: 'ff3e36826e',
    posOrgId: BIOTRACK_ORGANIZATIONS[0].posId,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    birthday: new Date('1678-12-18'),
    medicalNumber: PATIENT_NUMBERS[18],
    medicalExpireDate: new Date('2020-12-01'),
    licenseExpireDate: new Date('1899-12-01'),
    addressLine2: '#1000',
    state: 'CA',
    phoneNumber: MOBILE_NUMBERS[19],
  },
];

export class BiotrackUserMock {
  private fixtureService: FixtureService;

  constructor(private readonly module: TestingModule) {
    this.fixtureService = module.get<FixtureService>(FixtureService);
  }

  async generate() {
    await this.setupBiotrackUsers();
  }

  async setupBiotrackUsers() {
    for (const btUser of MOCK_BIOTRACK_USER) {
      await this.fixtureService.saveEntityUsingValues(BiotrackUser, btUser);
    }
  }
}
