import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from '../entities/message.entity';
import { Organization } from '../entities/organization.entity';
import { UserMarketing } from '../entities/user-marketing.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { BillingService } from '../billing/billing.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, UserMarketing, Organization]),
    BillingModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, BillingService],
})
export class MessageModule {}
