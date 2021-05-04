export class OrderLogUpdateDto {
  readonly orderId: number;
  deliveryVerified?: boolean;
  receivedAmount?: number;
  note?: string;
  paymentCompletedDate?: Date;
  createdBy: number;
}
