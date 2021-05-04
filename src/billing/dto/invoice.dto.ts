import Stripe from 'stripe';

import { Invoice } from '../../entities/invoice.entity';

export interface InvoiceDto extends Partial<Invoice> {
  stripeInvoice?: Stripe.Invoice;
}
