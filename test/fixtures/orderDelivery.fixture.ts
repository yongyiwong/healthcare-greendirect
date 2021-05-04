import faker from 'faker';
import { BaseFixture } from './base.fixture';
import { FulfillmentMethod } from '../../src/order/order-status.enum';

export class OrderDeliveryFixture extends BaseFixture {
  deliveryAddressLine1 = faker.address.streetAddress();
  deliveryAddressLine2 = faker.address.secondaryAddress();
  deliveryCity = faker.address.city();
  deliveryPostalCode = faker.address.zipCode();
  deliveryInstruction = faker.lorem.sentence();
  isDelivery = true;
  fullfillmentMethod = FulfillmentMethod.DELIVERY;
}
