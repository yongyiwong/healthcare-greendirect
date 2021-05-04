import faker from 'faker';
import { BaseFixture } from './base.fixture';
/**
 * Mock object generator for Product Entity
 */
export class ProductFixture extends BaseFixture {
  name = faker.commerce.productName();
  pricingType = 'weight';
  pricing = {
    price: parseFloat(faker.commerce.price()),
    weightPrices: [
      { name: '1g', price: parseFloat(faker.commerce.price()) },
      { name: '2g', price: parseFloat(faker.commerce.price()) },
      { name: '1/8oz', price: parseFloat(faker.commerce.price()) },
    ],
  };
}
