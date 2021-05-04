import faker from 'faker';
import { BaseFixture } from './base.fixture';
/**
 * Mock object generator for BiotrackUser Entity
 */
export class BiotrackUserFixture extends BaseFixture {
  posId = faker.random.alphaNumeric(10);
  firstName = faker.name.firstName();
  lastName = faker.name.lastName();
  birthday = faker.date.past();
  isSmsOptIn = false;
  isDeleted = false;
  created = new Date();
  modified = new Date();
  // Refer to biotrack-user.entity to add fake data for other fields.
}
