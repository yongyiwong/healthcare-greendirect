import faker from 'faker';
import { BaseFixture } from './base.fixture';
/**
 * Mock object generator for Product Entity
 */
export class PromoBannerFixture extends BaseFixture {
  name = 'BANNER! ' + faker.commerce.productName() + ' 4U!';
  bannerUrl =
    'https://placekitten.com/1024/240?image=' +
    faker.random.number({
      min: 1,
      max: 16,
    });
  bannerMobileUrl =
    'https://placekitten.com/375/110?image=' +
    faker.random.number({
      min: 1,
      max: 16,
    });
  isActive = false;
}
