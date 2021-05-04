import { DeliveryStatus } from '../../entities/delivery.entity';

export class UpdateDeliveryDto {
  id: number;
  readonly deliveryStatus: DeliveryStatus;
  modifiedBy: number;
}
