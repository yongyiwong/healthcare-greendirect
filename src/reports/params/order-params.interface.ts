import { OrderStatus, FulfillmentMethod } from '../../order/order-status.enum';
export interface OrderReportParams {
  locationId: number;
  submittedDateFrom?: Date | number; // Unix epoch ms
  submittedDateTo?: Date | number;
  modifiedDateFrom?: Date | number;
  modifiedDateTo?: Date | number;
  orderUserId?: number;
  orderStatus?: OrderStatus;
  fulfillmentMethod?: FulfillmentMethod;
  includeDeleted?: boolean;
  allLocations?: boolean;
}
