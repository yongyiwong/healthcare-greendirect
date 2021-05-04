import { DeepPartial } from 'typeorm';
import { Delivery, DeliveryStatus } from '../../entities/delivery.entity';
import { Location } from '../../entities/location.entity';
import { Order } from '../../entities/order.entity';
import { User } from '../../entities/user.entity';

export class DeliverySearchDto implements DeepPartial<Delivery> {
  id: number;
  deliveryStatus: DeliveryStatus;
  created: Date;
  createdBy: number;
  modified: Date;
  modifiedBy: number;
  location: Pick<Location, 'name' | 'deleted'>;
  driverUser: Pick<User, 'id' | 'firstName' | 'lastName' | 'mobileNumber'>;
  orders: Array<Order & { productCount: number }>;
}
