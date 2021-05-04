import faker from 'faker';
import { BaseFixture } from './base.fixture';
/**
 * Mock object generator for UserFixture Entity
 */
export class UserFixture extends BaseFixture {
  email = faker.internet.exampleEmail();
  password = faker.internet.password(); // this is not hashed since this is directly saved to database
  firstName = faker.name.firstName();
  lastName = faker.name.lastName();
}
