import faker from 'faker';
import { BaseFixture } from './base.fixture';
/**
 * Mock object generator for FreewayUser Entity
 */
export class FreewayUserFixture extends BaseFixture {
  // Override these values to use an existing GD user's data.
  posId = faker.random.number();
  email = faker.internet.exampleEmail();
  firstName = faker.name.firstName();
  lastName = faker.name.lastName();
  orgId = 0;
  totalPoints = faker.random.number({
    min: 0,
    max: 2050,
  });

  // Refer to freeway-user.entity to add fake data for other fields.
}
