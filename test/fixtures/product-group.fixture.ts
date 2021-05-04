import faker from 'faker';
import { BaseFixture } from './base.fixture';

const RANDOM_NUMBER_CONFIG = {
  min: 200,
  max: 300,
};

export class ProductGroupFixture extends BaseFixture {
  name = 'MOCK-' + faker.commerce.productName();
  description = faker.lorem.words(15);
  category = faker.commerce.product();
  imageUrl = `https://placekitten.com/${faker.random.number(
    RANDOM_NUMBER_CONFIG,
  )}/${faker.random.number(RANDOM_NUMBER_CONFIG)}`;
}
