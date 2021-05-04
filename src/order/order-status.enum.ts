/**
 * Most of the statuses are from MJ freeway
 */
export enum OrderStatus {
  OPEN = 'open',
  SUBMITTED = 'submitted', // Pickup/Delivery Will be differentiated by isDelivery column
  DELIVERY = 'delivery', // driver is out for delivery
  DELIVERED = 'delivered', // delivery done, ready for flagging as completed
  COMPLETED = 'completed', // Picked Up or Confirmed as Delivered - end of transaction
  CANCELLED = 'cancelled', // add note on reason for cancel and mode (user-cancelled, pickup failed, or delivery failed).
  CLOSED = 'closed', // not from MJ, already used to close out empty unsubmitted carts
}

/**
 * Important:
 * By default, submitted orders are set as Pickup and Submitted is displayed as Ready For Pickup
 * For delivery orders, submitted orders are displayed as Submitted as normal.
 */
export const OrderStatusDescription: {
  [OS in OrderStatus]: { name: string; description: string };
} = {
  [OrderStatus.OPEN]: {
    name: 'Open',
    description: `Order has not been submitted`, // New shopping Cart
  },
  [OrderStatus.SUBMITTED]: {
    name: 'Submitted',
    description: `Order submitted for processing`, // User has submitted order for dispensary processing.
  },
  [OrderStatus.DELIVERY]: {
    name: 'Out for Delivery',
    description: `Out for Delivery`, // Dispensary flags user that order is in transit.
  },
  [OrderStatus.DELIVERED]: {
    name: 'Delivered',
    description: 'Delivered',
  },
  [OrderStatus.COMPLETED]: {
    name: 'Completed',
    description: `Completed`, // Order has been picked up. Manually replace with 'Delivered' if isDelivery
  },
  [OrderStatus.CANCELLED]: {
    name: 'Cancelled',
    description: `Cancelled`, // Order will no longer proceed. See order notes.
  },
  [OrderStatus.CLOSED]: {
    name: 'Closed',
    description: `Closed`, // Current shopping cart has been cancelled, to allow cart to other locations
  },
};

/**
 * MJ Freeway fulfillment tracks
 */
export enum FulfillmentMethod {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}
