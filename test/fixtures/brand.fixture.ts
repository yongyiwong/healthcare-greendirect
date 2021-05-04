import faker from 'faker';
import { BaseFixture } from './base.fixture';

const RANDOM_NUMBER_CONFIG = {
  min: 200,
  max: 300,
};

export class BrandFixture extends BaseFixture {
  name = 'MOCK-' + faker.commerce.productName();
  description = faker.lorem.words(6);
  imageUrl = `https://placekitten.com/${faker.random.number(
    RANDOM_NUMBER_CONFIG,
  )}/${faker.random.number(RANDOM_NUMBER_CONFIG)}`;
  url = faker.internet.url();
  publishDate = faker.date.recent(10);
  unpublishDate = faker.date.future(0.1, this.publishDate);
}
