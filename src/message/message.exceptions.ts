import { HttpStatus } from '@nestjs/common';
import * as _ from 'lodash';

import { ExpectedExceptionMap } from '../app.interface';
import { Message } from '../entities/message.entity';
import { BroadcastMessageCountDto } from './message.dto';

export const MESSAGE_QUOTA = 2;
const GENERAL_LIST = 'General List';

export const MessageExceptions: ExpectedExceptionMap = {
  broadcastMessageRestricted: {
    message: `You have already reached the max limit of SMS Blasts this week.`,
    httpStatus: HttpStatus.CONFLICT,
    failCondition: (dto: BroadcastMessageCountDto[]) =>
      !!dto.length && !!dto.filter(d => d.count >= MESSAGE_QUOTA).length,
    messageFn(countDto: BroadcastMessageCountDto[]) {
      const orgNames = countDto
        .filter(dto => this.failCondition([dto]))
        .map(({ organizationName }) => organizationName || GENERAL_LIST)
        .join(', ');
      const messageWithLimit = this.message.replace(
        'limit of SMS Blasts',
        `limit of ${MESSAGE_QUOTA} SMS Blasts`,
      );
      return messageWithLimit.replace('Blasts', `Blasts to ${orgNames}`);
    },
  },
  messageRequired: {
    message: 'Message is required.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (message: Message) => !message || !message.id,
  },
  phoneNumberRequiredToSubscribe: {
    message: 'Phone number missing, so SMS Subscription is skipped.',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    failCondition: phoneNumber => !phoneNumber,
  },
};
