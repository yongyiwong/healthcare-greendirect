export interface OrderCountSummaryDto {
  locationId: number;
  locationName: string;
  locationTimezone: string;
  completedCount: number;
  openCount: number;
  cancelledCount: number;
  submittedCount: number;
  deliveryCount: number;
  totalCount: number;
}
