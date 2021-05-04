import { TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/user';
import { RolesService } from '../../src/roles/roles.service';
import { Role } from '../../src/entities/role.entity';
import { User } from '../../src/entities/user.entity';
import * as _ from 'lodash';
import { UserAddress } from '../../src/entities/user-address.entity';
import { State } from '../../src/entities/state.entity';
import { MOCK_BIOTRACK_USER } from './biotrack-user.mock';
import { MOCK_FREEWAY_USER } from './freeway-user.mock';
import { MOCK_USERS, MOCK_ADMINS } from './data/user.data';

export const MOCK_USER_DATA = MOCK_USERS;
export const MOCK_ADMIN_EMAILS = MOCK_ADMINS;

export const MOCK_USER_BIOTRACK = MOCK_BIOTRACK_USER.map(biotrackUser => {
  return {
    email: biotrackUser.email,
    firstName: biotrackUser.firstName,
    lastName: biotrackUser.lastName,
    password: '',
    mobileNumber: biotrackUser.phoneNumber,
    patientNumber: biotrackUser.medicalNumber,
  };
});

export const MOCK_USER_FREEWAY = MOCK_FREEWAY_USER.map(freewayUser => {
  return {
    email: freewayUser.email,
    firstName: freewayUser.firstName,
    lastName: freewayUser.lastName,
    password: '',
    mobileNumber: !_.isEmpty(freewayUser.phoneNumbers)
      ? freewayUser.phoneNumbers[0].number
      : null,
    patientNumber: !_.isEmpty(freewayUser.ids)
      ? freewayUser.ids[0].idNumber
      : null,
  };
});

export const MOCK_USER_ADDRESSES = [
  {
    addressLine1: '06967 Burrows Hill',
    city: 'Lhokkruet',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629999999998)',
  },
  {
    addressLine1: '18 Colorado Center',
    city: 'Nurlat',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629991199998)',
  },
  {
    addressLine1: '20661 Farragut Circle',
    city: 'Ilembula',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629999999998)',
  },
  {
    addressLine1: '06 Dahle Crossing',
    city: 'Föglö',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629999999998)',
  },
  {
    addressLine1: '3168 Sundown Park',
    city: 'Zákupy',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629999689998)',
  },
  {
    addressLine1: '70 Badeau Lane',
    city: 'Bīrganj',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629999569998)',
  },
  {
    addressLine1: '924 Meadow Valley Place',
    city: 'Gucheng',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629998999998)',
  },
  {
    addressLine1: '999 Tennessee Circle',
    city: 'Gonbad-e Kāvūs',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629995699998)',
  },
  {
    addressLine1: '660 Sachs Road',
    city: 'Hantsavichy',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629229999998)',
  },
  {
    addressLine1: '43033 Shasta Terrace',
    city: 'Fristad',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629999999198)',
  },
  {
    addressLine1: '25888 Iowa Center',
    city: 'Wulin',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629999299998)',
  },
  {
    addressLine1: '35 Buell Junction',
    city: 'Novokayakent',
    state: 52,
    postalCode: '9000',
    nickname: 'Default Delivery Address',
    longLat: '(121.045916000000005,14.5652629999939998)',
  },
  {
    addressLine1: '5 Debs Plaza',
    city: 'Arão',
    state: 52,
    postalCode: '9000',
    nickname: 'Home Sweet Home',
    longLat: '(121.045916000000005,14.5652629999499998)',
  },
  {
    addressLine1: '54 Lake View Terrace',
    city: 'Zuoxi',
    state: 52,
    postalCode: '9000',
    nickname: 'Word',
    longLat: '(121.045916000000005,14.5652629999959998)',
  },
  {
    addressLine1: '4438 Pleasure Street',
    city: 'Jetafe',
    state: 52,
    postalCode: '9000',
    nickname: 'Office',
    longLat: '(121.045916000000005,14.5652629999999798)',
  },
  {
    addressLine1: '2 Village Way',
    city: 'Atamyrat',
    state: 52,
    postalCode: '9000',
    nickname: 'Home',
    longLat: '(121.045916000000005,14.5652629999999997)',
  },
  {
    addressLine1: '123 Bannaba Street',
    city: 'Toa Baja',
    state: 52,
    postalCode: '00966',
    nickname: 'Home 1',
    longLat: '(121.045916000000005,14.5652629999999798)',
  },
  {
    addressLine1: '88 Village Diamond',
    city: 'San Juan',
    state: 52,
    postalCode: '00949',
    nickname: 'Home 2',
    longLat: '(121.045916000000005,14.5652629999999997)',
  },
  {
    addressLine1: '113 Bannaba Street',
    city: 'Toa Baja',
    state: 52,
    postalCode: '00966',
    nickname: 'Home 3',
    longLat: '(121.045916000000115,14.5652629999999798)',
  },
  {
    addressLine1: '111 Village Diamond',
    city: 'San Juan',
    state: 52,
    postalCode: '00949',
    nickname: 'Home 4',
    longLat: '(121.045916000000125,14.5652629999999997)',
  },
  {
    addressLine1: '555 Bannaba Street',
    city: 'Toa Baja',
    state: 52,
    postalCode: '00966',
    nickname: 'Home 5',
    longLat: '(121.045916000000095,14.5652629999999798)',
  },
  {
    addressLine1: '222 Village Diamond',
    city: 'San Juan',
    state: 52,
    postalCode: '00949',
    nickname: 'Home 6',
    longLat: '(121.045916000000015,14.5652629999999997)',
  },
  {
    addressLine1: '99 Bannaba Street',
    city: 'Toa Baja',
    state: 52,
    postalCode: '00966',
    nickname: 'Home 7',
    longLat: '(121.045916000001115,14.5652629999999798)',
  },
  {
    addressLine1: '33 Village Diamond',
    city: 'San Juan',
    state: 52,
    postalCode: '00949',
    nickname: 'Home 8',
    longLat: '(121.045916000003215,14.5652629999999997)',
  },
  {
    addressLine1: '125 Bannaba Street',
    city: 'Toa Baja',
    state: 52,
    postalCode: '00966',
    nickname: 'Home 9',
    longLat: '(121.045916000123005,14.5652629999999798)',
  },
  {
    addressLine1: '531 Village Diamond',
    city: 'San Juan',
    state: 52,
    postalCode: '00949',
    nickname: 'Home 10',
    longLat: '(121.045916000001235,14.5652629999999997)',
  },
];

export class UserMock {
  private rolesService: RolesService;
  private userService: UserService;

  constructor(private readonly module: TestingModule) {
    this.userService = module.get<UserService>(UserService);
    this.rolesService = module.get<RolesService>(RolesService);
  }

  async generate() {
    const adminRole = await this.setupRole('Admin');
    const userMocks = [
      ...MOCK_USER_DATA,
      ...MOCK_USER_BIOTRACK,
      ...MOCK_USER_FREEWAY,
    ];
    for (const user of userMocks) {
      if (MOCK_ADMIN_EMAILS.includes(user.email)) {
        await this.setupUser(user, adminRole);
      } else {
        await this.setupUser(user);
      }
      await this.setupAddress(user);
    }
  }

  async setupRole(roleName: string): Promise<Role> {
    // Make sure Admin role exists
    let role = (await this.rolesService.findByName(roleName)) as Role;
    if (!role) {
      // Create Admin role if it doesn't exist
      role = new Role();
      role.name = roleName;
      role = (await this.rolesService.create(role)) as Role;
    }
    return role;
  }

  async setupUser(userInfo: any, role?: Role): Promise<User> {
    // Make sure test admin e2e user exists
    let user = (await this.userService.findByEmail(userInfo.email)) as User;
    if (!user) {
      user = {
        ...new User(),
        ...userInfo,
        ...{ verificationCode: '0000', verified: true },
      };
      user = await this.userService.create(user as any);
      if (role) user.roles = [role];
    }

    expect(user).toHaveProperty('id');
    return user as User;
  }

  async setupAddress(userInfo: any) {
    const user = await this.userService.findByEmail(userInfo.email);
    const address = {
      ...new UserAddress(),
      ...MOCK_USER_ADDRESSES[user.id - 5],
      ...{
        state: new State(),
        userId: user.id,
      },
    };
    address.state.id = MOCK_USER_ADDRESSES[user.id - 5].state;
    return this.userService.createUserAddress(address);
  }
}
