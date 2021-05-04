import { HttpStatus } from '@nestjs/common';
import { isEmpty } from 'lodash';
import Stripe from 'stripe';

import { ExpectedExceptionMap } from '../app.interface';
import { Organization } from '../entities/organization.entity';

export const BillingExceptions: ExpectedExceptionMap = {
  noCustomerId: {
    message:
      'Error: Company has no billing card reference. Create card information in the Billing Section.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (customerId: string) => !customerId,
  },
  noDefaultCard: {
    message:
      'Error: Company has no default billing card. Create card information in the Billing Section.',
    messageFn(customerName) {
      return customerName
        ? this.message.replace('Company', customerName)
        : this.message;
    },
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (defaultCard: string) => !defaultCard,
  },
  cardTokenUnrecognized: {
    message:
      'Error: Request token for billing card information was not recognized. Resubmit card information to try again.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (errorCode: string) => errorCode === 'resource_missing',
  },
  cardTokenExpired: {
    message:
      'Error: Request token for billing card information has expired. Resubmit card information to try again.',
    httpStatus: HttpStatus.CONFLICT,
    failCondition: (errorCode: string) => errorCode === 'token_already_used',
  },
  retrieveCardTokenFailed: {
    message:
      'Error: Retrieving billing card information failed. Resubmit card information to try again.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    failCondition: (cardToken: Stripe.Token) =>
      isEmpty(cardToken && cardToken.card),
  },
  createCardFailed: {
    message:
      'Error: Creating billing card information failed. Resubmit card information to try again.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    failCondition: (createdCustomer: Stripe.Customer) => !createdCustomer,
  },
  updateCardFailed: {
    message:
      'Error: Updating billing card information failed. Resubmit card information to try again.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    failCondition: (updatedCustomer: Stripe.Customer) => !updatedCustomer,
  },
  deleteCardFailed: {
    message:
      'Error: Deleting billing card information failed. Resubmit the request for card deletion to try again.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    failCondition: (deletedCard: Stripe.DeletedCard) => !deletedCard,
  },
  saveCardReferenceFailed: {
    message:
      'Error: Saving billing card reference failed. Resubmit card information to try again.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    failCondition: (updatedOrganization: Organization) => !updatedOrganization,
  },
  noDefaultMessageUnitPrice: {
    message: 'Error: SMS Blast billing has no unit price set up.',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
    failCondition: (unitPrice: number) => !unitPrice || unitPrice <= 0,
  },
  createInvoiceFailed: {
    message:
      'Error: creating an invoice failed. Please wait a while and try again later.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  externalInvoiceNotFound: {
    message: 'Error: Invoice record was not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (errorCode: string) => errorCode === 'resource_missing',
  },
};
