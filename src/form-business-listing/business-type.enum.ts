export enum BusinessType {
  BRAND = 'brand',
  DISPENSARY = 'dispensary',
  DELIVERY = 'delivery',
  DOCTOR = 'doctor',
}

export const BusinessTypeDescription: {
  [BT in BusinessType]: { name: string; description: string };
} = {
  [BusinessType.BRAND]: {
    name: 'Brand',
    description: 'Brand',
  },
  [BusinessType.DISPENSARY]: {
    name: 'Dispensary',
    description: 'Dispensary',
  },
  [BusinessType.DELIVERY]: {
    name: 'Delivery',
    description: 'Delivery',
  },
  [BusinessType.DOCTOR]: {
    name: 'Doctor',
    description: 'Doctor',
  },
};
