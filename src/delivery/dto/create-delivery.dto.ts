import { Location } from '../../entities/location.entity';
import { Order } from '../../entities/order.entity';

export class CreateDeliveryDto {
  readonly location: Location;
  orders?: Array<Order['id']>;
}
