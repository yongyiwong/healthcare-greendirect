import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillingService } from './billing.service';
import { Invoice } from '../entities/invoice.entity';
import { StripeService } from './stripe/stripe.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice])],
  providers: [BillingService, StripeService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}
