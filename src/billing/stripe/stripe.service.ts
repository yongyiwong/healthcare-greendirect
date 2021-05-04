import { Injectable } from '@nestjs/common';
import { ConfigService } from '@sierralabs/nest-utils';
import Stripe from 'stripe';
import { defaultTo } from 'lodash';

import { GDExpectedException } from '../../gd-expected.exception';
import { StripeExceptions } from './stripe.exceptions';
import { InvoiceItem } from './invoice-item.interface';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get('vendors.stripe.apiSecretKey');
    const apiVersion = this.configService.get('vendors.stripe.apiVersion');
    this.stripe = new Stripe(secretKey, { apiVersion });
  }

  async createCustomer(
    customerDetail: Stripe.CustomerCreateParams,
  ): Promise<Stripe.Customer> {
    return this.stripe.customers.create(customerDetail);
  }

  async updateCustomer(
    customerId: string,
    customerDetail: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Customer> {
    return this.stripe.customers.update(customerId, customerDetail);
  }

  async retrieveCustomer(
    customerId: string,
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return this.stripe.customers.retrieve(customerId);
  }

  async retrieveToken(tokenId: string): Promise<Stripe.Token> {
    return this.stripe.tokens.retrieve(tokenId);
  }

  async addCardToCustomer(customerId: string, tokenId: string) {
    return this.stripe.customers.createSource(customerId, { source: tokenId });
  }

  async retrieveCard(
    customerId: string,
    cardId: string,
  ): Promise<Stripe.CustomerSource> {
    return this.stripe.customers.retrieveSource(customerId, cardId);
  }

  async deleteCard(
    customerId: string,
    cardId: string,
  ): Promise<
    | Stripe.CustomerSource
    | Stripe.DeletedAlipayAccount
    | Stripe.DeletedBankAccount
    | Stripe.DeletedBitcoinReceiver
    | Stripe.DeletedCard
  > {
    return this.stripe.customers.deleteSource(customerId, cardId);
  }

  /**
   * https://stripe.com/docs/api/invoices/create
   * @returns Returns the invoice object if there are pending invoice items to invoice.
   * Returns an error if there are no pending invoice items or
   * if the customer ID provided is invalid.
   */
  async createInvoice(
    customerId: string,
    chargeImmediately = false,
    memo?: string,
  ): Promise<Stripe.Invoice> {
    try {
      GDExpectedException.try(StripeExceptions.customerIdRequired, customerId);
      const invoice: Stripe.InvoiceCreateParams = {
        customer: customerId,
        auto_advance: chargeImmediately,
        collection_method: 'charge_automatically',
        description: memo,
      };
      return this.stripe.invoices.create(invoice);
    } catch (error) {
      throw error;
    }
  }

  async getInvoice(invoiceId: string) {
    if (!invoiceId) return null;
    const stripeInvoice = await this.stripe.invoices.retrieve(invoiceId);
    return stripeInvoice;
  }

  async finalizeInvoice(invoiceId: string) {
    if (!invoiceId) return null;
    const stripeInvoice = await this.stripe.invoices.finalizeInvoice(invoiceId);
    return stripeInvoice;
  }

  async payInvoice(invoiceId: string) {
    if (!invoiceId) return null;
    const stripeInvoice = await this.stripe.invoices.pay(invoiceId);
    return stripeInvoice;
  }

  async voidInvoice(invoiceId: string) {
    if (!invoiceId) return null;
    const voidInvoice = await this.stripe.invoices.voidInvoice(invoiceId);
    return voidInvoice;
  }

  async createInvoiceItems(
    customerId: string,
    items: InvoiceItem[],
    currency: string = 'usd',
  ): Promise<Stripe.InvoiceItem[]> {
    try {
      GDExpectedException.try(StripeExceptions.customerIdRequired, customerId);
      GDExpectedException.try(StripeExceptions.invoiceItemRequired, items);

      const invoiceItems: Stripe.InvoiceItemCreateParams[] = items.map(
        (item: InvoiceItem) => {
          // convert unitPrice from dollar to cents, assuming that the currency is always `usd`
          const unitPriceInCents = defaultTo(item.unitPrice, 0) * 100;
          return {
            customer: customerId,
            currency,
            unit_amount_decimal: unitPriceInCents.toString(),
            description: item.name,
            quantity: item.quantity,
          };
        },
      );

      const invoiceItemsPromises = invoiceItems.map(
        (invoiceItem: Stripe.InvoiceItemCreateParams) =>
          this.stripe.invoiceItems.create(invoiceItem),
      );
      return Promise.all(invoiceItemsPromises);
    } catch (error) {
      throw error;
    }
  }
}
