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

const randomKitten = (ratios, ratioIndex) =>
  `https://placekitten.com/${ratios[ratioIndex].w}/${ratios[ratioIndex].h}`;

export class CouponFixture extends BaseFixture {
  name = 'COUPON' + new Date().getTime();
  description = faker.lorem.words(6);
  imageUrl = randomKitten(
    ratios_3by2,
    faker.random.number(RANDOM_NUMBER_CONFIG),
  );
  effectiveDate = faker.date.recent(10);
  expirationDate = faker.date.future(0.1, this.effectiveDate);
  discountAmount = 10;
  discountType = 'fixed';
}
