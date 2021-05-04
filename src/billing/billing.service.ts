import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';
import * as _ from 'lodash';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

import { StripeService } from './stripe/stripe.service';
import { GDExpectedException } from '../gd-expected.exception';
import { BillingExceptions } from './billing.exceptions';
import { Invoice, StripeInvoiceStatus } from '../entities/invoice.entity';
import { BroadcastMessageCountDto } from '../message/message.dto';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { InvoiceItem } from './stripe/invoice-item.interface';
import { StripeExceptions } from './stripe/stripe.exceptions';
import { InvoiceDto } from './dto/invoice.dto';

@Injectable()
export class BillingService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async getCustomer(
    customerId: string,
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    try {
      const customer = (await this.stripeService.retrieveCustomer(
        customerId,
      )) as Stripe.Customer | Stripe.DeletedCustomer;
      return customer;
    } catch (error) {
      return null;
    }
  }

  async getDefaultCardId(customerId: string): Promise<string> {
    try {
      const customer = (await this.stripeService.retrieveCustomer(
        customerId,
      )) as Stripe.Customer;
      return customer && (customer.default_source as string);
    } catch (error) {
      throw error;
    }
  }

  async setupCustomerCardDetail(
    tokenId: string,
  ): Promise<Stripe.CustomerCreateParams | Stripe.CustomerUpdateParams> {
    try {
      const cardToken = await this.retrieveToken(tokenId);
      GDExpectedException.try(
        BillingExceptions.retrieveCardTokenFailed,
        cardToken,
      );

      const cardDetail = cardToken.card;
      const customerDetail = {
        name: cardDetail.name,
        address: {
          line1: cardDetail.address_line1,
          line2: cardDetail.address_line2,
          city: cardDetail.address_city,
          postal_code: cardDetail.address_zip,
          state: cardDetail.address_state,
          country: cardDetail.address_country,
        },
      };

      return customerDetail;
    } catch (error) {
      throw error;
    }
  }

  async retrieveToken(tokenId: string): Promise<Stripe.Token> {
    let token: Stripe.Token;
    try {
      token = await this.stripeService.retrieveToken(tokenId);
    } catch (error) {
      GDExpectedException.try(
        BillingExceptions.cardTokenUnrecognized,
        error.code,
      );
      throw error;
    }
    return token;
  }

  async createCustomer(
    customerDetail: Stripe.CustomerCreateParams,
  ): Promise<Stripe.Customer> {
    let customer: Stripe.Customer;
    try {
      customer = await this.stripeService.createCustomer(customerDetail);
    } catch (error) {
      GDExpectedException.try(BillingExceptions.cardTokenExpired, error.code);
      throw error;
    }
    return customer;
  }

  async updateCustomer(
    customerId: string,
    customerDetail: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Customer> {
    let customer: Stripe.Customer;
    try {
      customer = await this.stripeService.updateCustomer(
        customerId,
        customerDetail,
      );
    } catch (error) {
      GDExpectedException.try(BillingExceptions.cardTokenExpired, error.code);
      throw error;
    }
    return customer;
  }

  async retrieveCard(customerId: string): Promise<Stripe.CustomerSource> {
    try {
      const cardId = await this.getDefaultCardId(customerId);
      if (!cardId) return;
      return this.stripeService.retrieveCard(customerId, cardId);
    } catch (error) {
      throw error;
    }
  }

  async deleteCard(customerId: string): Promise<boolean> {
    try {
      const cardId = await this.getDefaultCardId(customerId);
      GDExpectedException.try(BillingExceptions.noDefaultCard, cardId);

      const deletedCard = await this.stripeService.deleteCard(
        customerId,
        cardId,
      );
      GDExpectedException.try(BillingExceptions.deleteCardFailed, deletedCard);

      return true;
    } catch (error) {
      throw error;
    }
  }

  async getInvoiceList(
    organizationId?: number,
    page: number = 0,
    limit: number = 100,
    order?: string,
  ): Promise<[Invoice[], number]> {
    try {
      const TABLE_NAME = 'invoice';
      const offset = page * limit;

      const query = this.invoiceRepository
        .createQueryBuilder(TABLE_NAME)
        .innerJoin(`${TABLE_NAME}.message`, 'message')
        .leftJoinAndSelect(`${TABLE_NAME}.createdBy`, 'user')
        .take(limit)
        .skip(offset);

      if (organizationId) {
        query.where('message.organization = :organizationId', {
          organizationId,
        });
      }

      if (order) {
        // TODO make this an OrderBy Pipe/ transformer?
        const key = Object.keys(order)[0];
        order[`${TABLE_NAME}.${key}`] = order[key];
        delete order[key];
        query.orderBy(order);
      } else {
        query.orderBy(`${TABLE_NAME}.created`, 'DESC');
      }

      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  async getInvoice(invoiceId: number): Promise<Invoice> {
    if (!invoiceId) return null;

    return this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('id = :invoiceId', { invoiceId })
      .getOne();
  }

  async getExternalInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    let invoice: Stripe.Invoice;
    try {
      invoice = await this.stripeService.getInvoice(invoiceId);
    } catch (error) {
      GDExpectedException.try(
        BillingExceptions.externalInvoiceNotFound,
        error.code,
      );
      throw error;
    }
    return invoice;
  }

  async prepareInvoiceForSMSBlast(
    messageCounts: BroadcastMessageCountDto,
    organization: Organization,
    sender: User,
    smsCount: number = 1,
  ): Promise<InvoiceDto> {
    GDExpectedException.try(
      BillingExceptions.noCustomerId,
      organization.stripeCustomerId,
    );

    const cardId = await this.getDefaultCardId(organization.stripeCustomerId);
    GDExpectedException.try(BillingExceptions.noDefaultCard, cardId);

    const unitPrice =
      this.configService.get('vendors.stripe.messagingFee') || 0;
    GDExpectedException.try(
      BillingExceptions.noDefaultMessageUnitPrice,
      unitPrice,
    );

    const { stripeCustomerId, name } = organization;
    try {
      const item: InvoiceItem = {
        name: `SMS Blast service`,
        quantity: messageCounts.count * smsCount,
        unitPrice,
      };
      const invoiceItems = await this.stripeService.createInvoiceItems(
        stripeCustomerId,
        [item],
      );
      if (invoiceItems.length) {
        const USD_CENTS_MULTIPLIER = 100;
        const invoice = await this.stripeService.createInvoice(
          stripeCustomerId,
          false,
          `For SMS Blast to subscribers.`,
        );
        const amountInUsd = invoice.total / USD_CENTS_MULTIPLIER;

        return Object.assign(new Invoice(), {
          status: StripeInvoiceStatus.DRAFT,
          totalAmount: amountInUsd,
          stripeInvoiceId: invoice.id,
          description: invoice.description,
          createdBy: sender,
        } as InvoiceDto);
      }

      // Reaching this point means something incomplete in the above steps
      GDExpectedException.throw(BillingExceptions.createInvoiceFailed);
    } catch (error) {
      throw error;
    }
  }

  async finalizeChargeInvoice(invoice: InvoiceDto): Promise<InvoiceDto> {
    try {
      const paidStripeInvoice = await this.stripeService.payInvoice(
        invoice.stripeInvoiceId,
      );

      let stripeChargeId = '';
      if (paidStripeInvoice.charge) {
        const { charge } = paidStripeInvoice;
        stripeChargeId = (charge as Stripe.Charge).id
          ? (charge as Stripe.Charge).id
          : (charge as string);
      } else {
        /*
          charge will be `null` if the customer does not have a card,
          or the amount to be paid is below $0.50 usd.
        */
        GDExpectedException.try(
          StripeExceptions.invoiceCannotBeCharged,
          paidStripeInvoice.charge,
        );
      }

      /*
        We need to verify `invoice.paid` because some cards might require extra manual action such as Strong Customer Auth (SCA)
        In that case, perhaps we can instead show them the invoice page in Billing Section with the link for `hosted_invoice_url as alternative
        Ref: https://stripe.com/docs/billing/invoices/workflow#asynchronous-payments
        In this case, we will still keep the Invoice entity as OPEN, to be paid manually.
      */
      return Object.assign(invoice, {
        id: invoice.id,
        status: paidStripeInvoice.paid
          ? StripeInvoiceStatus.PAID
          : StripeInvoiceStatus.OPEN,
        stripeChargeId,
      } as InvoiceDto);
    } catch (error) {
      GDExpectedException.try(
        StripeExceptions.minimumAmountChargeRequired,
        error,
      );
      throw error;
    }
  }
}
