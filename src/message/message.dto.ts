import { InvoiceDto } from '../billing/dto/invoice.dto';
import { Organization } from '../entities/organization.entity';
import { Message } from '../entities/message.entity';

export class BroadcastMessageDto {
  message: string;
  organizationIds: number[];
}

export class BroadcastMessageCountDto {
  organizationId: number;
  count: number;
  organizationName?: string;
}

export interface BroadcastSummaryDto {
  estimatedTotal: number;
  broadcasts: {
    message: Message;
    failures: number;
    organization?: Organization;
    invoice?: InvoiceDto;
  }[];
}
