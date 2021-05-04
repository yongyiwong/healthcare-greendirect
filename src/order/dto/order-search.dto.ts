import { OrderStatus } from '../order-status.enum';

export interface OrderSearchDto {
  id: number;
  firstName: string;
  lastName: string;
  userId: number;
  orderStatus: string;
  isDelivery: boolean;
  isSubmitted: boolean;
  submittedDate: Date;
  totalPrice: number;
  productCount: number;
  productTotalWeight: number;
  description: string;
  modified: string;
  orderReady: string;
}

export interface OrderUpdateDeliveryDto {
  id: number;
  isDelivery: boolean;
  userAddressId: number;
  selectedTimeSlot?: string;
}

export interface OrderHistoryUpdateDto {
  orderHistoryId: number;
  orderId: number;
  created: Date;
  createdBy: number;
  orderStatus: OrderStatus;
}

/** When providing the following params, only the first one will be used by the API. */
export interface IdentificationParams {
  patientNumber?: string;
  mobileNumber?: string;
  email?: string;
}
