import faker from 'faker';
import { BaseFixture } from './base.fixture';
import { Location } from '../../src/entities/location.entity';

/**
 * Mock object generator for Location Entity
 */
export class LocationFixture extends BaseFixture {
  name = faker.company.companyName();
  isDeliveryAvailable = faker.random.boolean();
}
