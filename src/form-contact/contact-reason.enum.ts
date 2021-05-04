export enum ContactReason {
  CORPORATE = 'corporate',
  BUG = 'bug_tech',
  SALES = 'sales',
  BILLING = 'billing',
  MARKETING = 'marketing_pr',
  CUST_SVC = 'customer_service',
  MOD_DEPT = 'moderation_dept',
}

export const ContactReasonDescription: {
  [CR in ContactReason]: { name: string; description: string };
} = {
  [ContactReason.CORPORATE]: {
    name: 'Corporate',
    description: `Corporate`,
  },
  [ContactReason.BUG]: {
    name: 'Bug/Technical',
    description: `Bug/Technical`,
  },
  [ContactReason.SALES]: {
    name: 'Sales',
    description: `Sales`,
  },
  [ContactReason.BILLING]: {
    name: 'Billing',
    description: `Billing`,
  },
  [ContactReason.MARKETING]: {
    name: 'Marketing/PR',
    description: `Marketing/PR`,
  },
  [ContactReason.CUST_SVC]: {
    name: 'Customer Service',
    description: `Customer Service`,
  },
  [ContactReason.MOD_DEPT]: {
    name: 'Moderation Department',
    description: `Moderation Department`,
  },
};
