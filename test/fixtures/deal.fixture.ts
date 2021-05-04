import faker from 'faker';
import { values } from 'lodash';

import { BaseFixture } from './base.fixture';
import { DealCategory } from '../../src/deal/deal-category.enum';

// 3:2 aspect ratio sizes
const ratios_3by2 = [
  { w: 1024, h: 683 },
  { w: 600, h: 400 },
  { w: 400, h: 267 },
  { w: 380, h: 253 },
  { w: 300, h: 200 },
  { w: 150, h: 100 },
];

const RANDOM_NUMBER_CONFIG = {
  min: 0,
  max: ratios_3by2.length - 1,
};

export const randomKitten = (ratios, ratioIndex) =>
  `https://placekitten.com/${ratios[ratioIndex].w}/${ratios[ratioIndex].h}`;

export class DealFixture extends BaseFixture {
  title = 'MOCK-' + faker.commerce.productName();
  description = faker.lorem.words(6);
  dealId = faker.lorem.words(4);
  imageUrl = randomKitten(
    ratios_3by2,
    faker.random.number(RANDOM_NUMBER_CONFIG),
  );
  category = faker.random.number({
    min: 1,
    max: values(DealCategory).filter(category => Number(category)).length,
  });
  startDate = faker.date.recent(10);
  endDate = faker.date.future(0.1, this.startDate);
  expirationDate = faker.date.future(0.1, this.endDate);
}
