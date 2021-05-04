import faker from 'faker';
import { BaseFixture } from './base.fixture';
/**
 * Mock object generator for UserAddress Entity
 */
export class UserAddressFixture extends BaseFixture {
  addressLine1 = faker.address.streetAddress();
  city = faker.address.city();
  state = { id: 52 };
  postalCode = faker.address.zipCode();
  country = faker.address.country();
  nickname = 'Default Delivery Address';
  longLat = '(121.045916000000005,14.5652629999999998)';
}
