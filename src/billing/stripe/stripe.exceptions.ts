import { HttpStatus } from '@nestjs/common';

import { isEmpty } from 'lodash';
import Stripe from 'stripe';

import { ExpectedExceptionMap } from '../../app.interface';
import { Organization } from '../../entities/organization.entity';

export const StripeExceptions: ExpectedExceptionMap = {
  customerIdRequired: {
    message: 'Stripe Customer ID is required',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (customerId: string) => !customerId,
  },
  invoiceItemRequired: {
    message: 'Atleast one invoice item is required.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (invoiceItems: Stripe.InvoiceItem[]) =>
      isEmpty(invoiceItems),
  },
  invoiceItemIdRequired: {
    message: 'Stripe Invoice Item ID is required',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (invoiceItemId: string) => !invoiceItemId,
  },
  noDefaultCardErrorFromStripe: {
    message:
      'Error: Company has no default billing card. Please set up Billing first.',
    messageFn(organization: Organization) {
      return this.message.replace('Company', organization.name);
    },
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: error =>
      /^Cannot charge a customer that has no active card/.test(error.message),
  },
  minimumAmountChargeRequired: {
    message:
      'Error: The broadcast receivers are too few. More than one receiver is required.',
    messageFn(count: number) {
      return this.message.replace('too few', `only ${count}`);
    },
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: error =>
      /^Amount must be at least $0.50 usd/.test(error.message),
  },
  invoiceCannotBeCharged: {
    message: `Stripe cannot charge this invoice. Customer must have a card, or the invoice's total amount should be $0.50 USD or higher.`,
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (charge: string | Stripe.Charge) => !charge,
  },
};
