import { SNS } from 'aws-sdk';
import * as _ from 'lodash';
import { EntityManager, Repository } from 'typeorm';
import {Injectable, LoggerService} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { GDExpectedException } from '../gd-expected.exception';
import { Message } from '../entities/message.entity';
import { Organization } from '../entities/organization.entity';
import { UserMarketing } from '../entities/user-marketing.entity';
import { User } from '../entities/user.entity';
import {
  BroadcastMessageDto,
  BroadcastMessageCountDto,
  BroadcastSummaryDto,
} from './message.dto';
import { isNonProduction, isProductionEnv } from '../app.service';
import { BillingService } from '../billing/billing.service';
import { InvoiceDto } from '../billing/dto/invoice.dto';
import { BillingExceptions } from '../billing/billing.exceptions';
import { MessageExceptions } from './message.exceptions';

import serializeError from 'serialize-error';
import {GreenDirectLogger} from '../greendirect-logger';

/** Ref: https://frightanic.com/software-development/regex-for-gsm-03-38-7bit-character-set/ */
export const GSM_CHARACTERS_REGEX =
  // tslint:disable-next-line:max-line-length
  '^[A-Za-z0-9 \\r\\n@£$¥èéùìòÇØøÅå\u0394_\u03A6\u0393\u039B\u03A9\u03A0\u03A8\u03A3\u0398\u039EÆæßÉ!"#$%&amp;\'()*+,\\-./:;&lt;=&gt;?¡ÄÖÑÜ§¿äöñüà^{}\\\\\\[~\\]|\u20AC]*$';

/**
 * SMS Message Limit depends on the encoding scheme.
 * Ref: https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-phone.html
 * GSM Characters: https://en.wikipedia.org/wiki/GSM_03.38#GSM_7-bit_default_alphabet_and_extension_table_of_3GPP_TS_23.038_.2F_GSM_03.38
 * UCS2: For strings with Emoji's
 */
enum MessageLimit {
  GSM = 160,
  UCS2 = 70,
}

@Injectable()
export class MessageService {
  protected readonly sns: SNS;
  private readonly MESSAGE_LIMIT = MessageLimit;
  private logger: LoggerService = new GreenDirectLogger('MessageService');

  constructor(
    @InjectRepository(Message)
    protected readonly messageRepository: Repository<Message>,
    @InjectRepository(UserMarketing)
    protected readonly userMarketingRepository: Repository<UserMarketing>,
    @InjectRepository(Organization)
    protected readonly organizationRepository: Repository<Organization>,
    protected readonly entityManager: EntityManager,
    protected readonly configService: ConfigService,
    protected readonly billingService: BillingService,
  ) {
    const snsOptions: SNS.ClientConfiguration = { apiVersion: '2010-03-31' };
    if (isNonProduction()) {
      // ! Allow specifying localstack SNS to test without using real AWS.
      const endpoint = this.configService.get('notification.aws.sns.endpoint');
      if (!!endpoint) {
        snsOptions.endpoint = endpoint;
      }
    }

    this.sns = new SNS(snsOptions);
  }

  async findAll(
    limit: number = 100,
    page: number = 0,
    order?: any,
    organizationId?: number,
    isOrganizationIdRequired?: boolean,
  ): Promise<[Message[], number]> {
    try {
      if (isOrganizationIdRequired && !organizationId) {
        return [[], 0];
      }

      const tableName = 'message';
      const offset = page * limit;
      const query = this.messageRepository
        .createQueryBuilder(tableName)
        .select()
        .addSelect([
          'user.id',
          'user.firstName',
          'user.lastName',
          'organization.id',
          'organization.name',
        ])
        .leftJoin(`${tableName}.createdBy`, 'user')
        .leftJoin(`${tableName}.organization`, 'organization')
        .limit(limit)
        .offset(offset);

      if (order) {
        const [column, value = 'ASC'] = order.split(' ');
        const orderValue = value.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        let orderColumn = '';
        if (column === 'createdBy') {
          orderColumn = `user.firstName`;
        } else {
          orderColumn = `${tableName}.${column}`;
        }
        query.orderBy(orderColumn, orderValue);
        query.addOrderBy(`${tableName}.id`, 'DESC');
      } else {
        query.orderBy(`${tableName}.id`, 'DESC');
      }

      if (organizationId) {
        query.where(`${tableName}.organization.id = :organizationId`, {
          organizationId,
        });
      }

      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk subscribe users to organization specific marketing
   * if not already subscribed.
   */
  async bulkSubscribeMarketing() {
    const results = await this.entityManager.query(`
      SELECT
        "user"."id" as "userId",
        "user"."mobile_number" as "mobileNumber",
        "organization"."id" as "organizationId",
        "organization"."text_topic_arn" as "textTopicArn"
      FROM "user"
      INNER JOIN "order" ON "order"."user_id" = "user"."id" AND "order"."order_status" NOT IN ('cancelled', 'closed')
      INNER JOIN "location" ON "location"."id" = "order"."location_id"
      INNER JOIN "organization" ON "organization"."id" = "location"."organization_id"
      WHERE "is_subscribed_to_marketing" = true AND "user"."mobile_number" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "user_marketing" WHERE user_id = "user"."id" AND organization_id = "organization"."id"
      )
      GROUP BY "user"."id", "user"."mobile_number", "organization"."id", "organization"."text_topic_arn"
      ORDER BY "user"."id", "user"."mobile_number", "organization"."id", "organization"."text_topic_arn"
    `);

    let count = 0;
    for (const row of results) {
      const subscriptionArn = await this.subscribeToTextMessageMarketing(
        row.userId,
        row.mobileNumber,
        row.organizationId,
      );
      count++;
      this.logger.log(
        `processed ${count} of ${results.length}: ${subscriptionArn}`,
      );
    }
  }

  async subscribeToTextMessageMarketing(
    userId: number,
    phoneNumber: string,
    organizationId?: number,
  ): Promise<string> {
    GDExpectedException.try(
      MessageExceptions.phoneNumberRequiredToSubscribe,
      phoneNumber,
    );
    try {
      let topicArn: string;
      const generalTopicArn: string = this.configService.get(
        'notification.aws.sns.topicArn',
      );
      // if organization is provided, first see if user is already subscribed to that ARN
      if (organizationId) {
        const userMarketing = await this.userMarketingRepository
          .createQueryBuilder('user_marketing')
          .select()
          .addSelect(['user.id'])
          .leftJoin('user_marketing.user', 'user')
          .where('user_marketing.user_id = :userId', { userId })
          .andWhere('user_marketing.organization_id = :organizationId', {
            organizationId,
          })
          .andWhere(
            'user_marketing.text_marketing_subscription_arn IS NOT NULL',
          )
          .getOne();
        if (userMarketing) {
          return userMarketing.textMarketingSubscriptionArn;
        } else {
          // if user is not already subscribed, set the topicARN to organization's ARN if exists, or default
          const organizationTopic = await this.organizationRepository.findOne({
            where: { id: organizationId },
          });
          if (!organizationTopic || !organizationTopic.textTopicArn) {
            // no textTopicArn found so abort (organization isn't part of the marketing messaging)
            return;
          }
          topicArn = organizationTopic.textTopicArn;
        }
      } else {
        topicArn = generalTopicArn;
      }
      const params: SNS.Types.SubscribeInput = {
        Protocol: 'sms',
        TopicArn: topicArn,
        Endpoint: phoneNumber,
        ReturnSubscriptionArn: true,
      };
      const response = await this.sns.subscribe(params).promise();
      await this.upsertUserMarketing(
        userId,
        response.SubscriptionArn,
        organizationId,
      );
      return response.SubscriptionArn;
    } catch (error) {
      throw error;
    }
  }

  async upsertUserMarketing(
    userId: number,
    subscriptionArn: string,
    organizationId?: number,
  ): Promise<UserMarketing> {
    try {
      let userMarketing: UserMarketing;
      // first check if user_marketing record already exists
      const query = this.userMarketingRepository
        .createQueryBuilder('user_marketing')
        .select()
        .where('user_id = :userId', { userId });
      if (!organizationId) {
        query.andWhere('organization_id IS NULL');
      } else {
        query.andWhere('organization_id = :organizationId', {
          organizationId,
        });
      }
      const existingUserMarketing = await query.getOne();

      // if existing record exists, only update the subscriptionArn
      if (existingUserMarketing) {
        existingUserMarketing.textMarketingSubscriptionArn = subscriptionArn;
        return this.userMarketingRepository.save(existingUserMarketing);
      } else {
        // if existing record does not exist, create new record
        userMarketing = new UserMarketing();
        userMarketing.user = new User();
        userMarketing.user.id = userId;
        if (organizationId) {
          userMarketing.organization = new Organization();
          userMarketing.organization.id = organizationId;
        }
        userMarketing.textMarketingSubscriptionArn = subscriptionArn;
        return this.userMarketingRepository.save(userMarketing);
      }
    } catch (error) {
      throw error;
    }
  }

  async unsubscribeToTextMessageMarketing(userId: number): Promise<any> {
    try {
      // first find all subscriptions for user
      const userMarketingSubscriptions = await this.userMarketingRepository
        .createQueryBuilder()
        .select()
        .where('user_id = :userId', { userId })
        .andWhere('text_marketing_subscription_arn IS NOT NULL')
        .getMany();

      // unsubscribe user from each topicArn
      for (const userMarketing of userMarketingSubscriptions) {
        const params: SNS.Types.UnsubscribeInput = {
          SubscriptionArn: userMarketing.textMarketingSubscriptionArn,
        };
        await this.sns.unsubscribe(params).promise();
      }

      // update records in user_marketing table
      await this.userMarketingRepository
        .createQueryBuilder()
        .update(UserMarketing)
        .set({ textMarketingSubscriptionArn: null })
        .where('user_id = :userId', { userId })
        .execute();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Note: this also auto-subscribes to General if not yet subscribed, so recheck that user.isSubscribedToMarketing=true
   * before calling this method.
   * @param userId
   * @param mobileNumber
   */
  async resubscribeToTextMessageMarketing(
    userId: number,
    mobileNumber: string,
  ): Promise<any> {
    GDExpectedException.try(
      MessageExceptions.phoneNumberRequiredToSubscribe,
      mobileNumber,
    );
    // find all previous subscriptions for user
    const userMarketingSubscriptions = await this.userMarketingRepository
      .createQueryBuilder('user_marketing')
      .select()
      .leftJoinAndSelect('user_marketing.organization', 'organization')
      .where('user_id = :userId', { userId })
      .andWhere('text_marketing_subscription_arn IS NOT NULL')
      .getMany();

    // 1. unsubscribe user
    await this.unsubscribeToTextMessageMarketing(userId);

    // 2. Handle different topics.
    // a. General List Topic: Resubscribe user
    const generalSubscription = userMarketingSubscriptions.find(
      userMarketing => !userMarketing.organization,
    );
    if (!generalSubscription) {
      await this.subscribeToTextMessageMarketing(userId, mobileNumber);
    }

    // b. Organization Topics: Subscribe again using new mobile number
    for (const userMarketing of userMarketingSubscriptions) {
      await this.subscribeToTextMessageMarketing(
        userId,
        mobileNumber,
        userMarketing.organization && userMarketing.organization.id,
      );
    }
  }

  async getMessageCountCurrentWeek(
    organizationIds?: number[],
  ): Promise<BroadcastMessageCountDto[]> {
    try {
      const PUERTO_RICO_TIMEZONE = 'America/Puerto_Rico';

      const query = this.messageRepository
        .createQueryBuilder('message')
        .select('COUNT(message.id)::INTEGER as count')
        .addSelect('organization.id as "organizationId"')
        .addSelect('organization.name as "organizationName"')
        .leftJoin('message.organization', 'organization')
        .where(
          // Default day of week = Monday
          // Minus 1 day interval to start week by Sunday
          `DATE_TRUNC('WEEK', message.created AT TIME ZONE 'UTC' AT TIME ZONE '${PUERTO_RICO_TIMEZONE}'
            + interval '1 day')::date - INTERVAL '1 DAY' =
           DATE_TRUNC('WEEK', NOW()  AT TIME ZONE '${PUERTO_RICO_TIMEZONE}'
            + interval '1 day')::date - INTERVAL '1 DAY'
          `,
        )
        .groupBy('organization.id');
      if (!_.isEmpty(organizationIds)) {
        const isGeneralListFound = organizationIds.some(orgId => !orgId);
        query.andWhere(
          `(message.organization IN (:...organizationIds)
            ${isGeneralListFound ? 'OR message.organization IS NULL' : ''}
          )`,
          { organizationIds },
        );
      }

      return query.getRawMany();
    } catch (error) {
      throw error;
    }
  }

  async broadcastMarketingMessage(
    user: User,
    messageDto: BroadcastMessageDto,
    enableBilling = false,
  ) {
    // throw new ServiceUnavailableException(
    //   'The SMS Blast feature is under maintenance and is temporarily unavailable.',
    // );

    if (_.isEmpty(messageDto.organizationIds)) {
      return;
    }

    /*
      Disabled weekly limits

      const messageCounts: BroadcastMessageCountDto[] = await this.getMessageCountCurrentWeek(
        messageDto.organizationIds,
      );
      const { broadcastMessageRestricted } = MessageExceptions;
      GDExpectedException.try(
        broadcastMessageRestricted,
        messageCounts,
        messageCounts,
      );
    */

    try {
      // Start broadcasts
      const broadcastSummary: BroadcastSummaryDto = {
        estimatedTotal: 0,
        broadcasts: [],
      };

      for (const orgId of messageDto.organizationIds) {
        const organization = await this.getOrganizationById(orgId);
        let blastInvoice: InvoiceDto = { totalAmount: 0 };
        let failures = 0;

        // first get estimated send count for the topic
        const messageCountDto: BroadcastMessageCountDto = _.first(
          await this.getBroadcastMessageCount(orgId, !!orgId),
        );
        if (messageCountDto.count === 0) {
          this.logger.log(
            `WARN SMS BLAST: No receivers - skipping ${organization.name}`,
          );
          continue;
        }

        const smsCount = this.getSMSCount(messageDto.message);

        const unitPrice =
          this.configService.get('vendors.stripe.messagingFee') || 0;
        GDExpectedException.try(
          BillingExceptions.noDefaultMessageUnitPrice,
          unitPrice,
        );

        // Compute and confirm invoice paid before sending
        if (enableBilling) {
          const prepareInvoiceTrans = async transactionalEntityManager => {
            const draftInvoice = await this.billingService.prepareInvoiceForSMSBlast(
              messageCountDto,
              organization,
              user,
              smsCount,
            );
            const finalInvoice = await this.billingService.finalizeChargeInvoice(
              draftInvoice,
            );
            blastInvoice = (await transactionalEntityManager.save(
              finalInvoice,
            )) as InvoiceDto;
          };
          await this.entityManager.transaction(prepareInvoiceTrans);
          blastInvoice = await this.billingService.getInvoice(blastInvoice.id);
        }

        const params = this.composeSNSParams(messageDto.message, organization);
        const message = Object.assign(new Message(), {
          text: messageDto.message,
          estimateSendCount: messageCountDto.count,
          createdBy: user,
          organization: Object.assign(new Organization(), { id: orgId }),
        });

        // Broadcast message in a transaction so that if an error occurs while sending
        // the text message the transaction will abort.
        const smsBlastTrans = msg => async transactionalEntityManager => {
          const savedMessage: Message = await transactionalEntityManager.save(
            msg,
          );
          if (enableBilling) {
            blastInvoice = Object.assign(blastInvoice, {
              message: savedMessage,
            });
            delete blastInvoice.modified;
            await transactionalEntityManager.save(blastInvoice);
          }
          try {
            if (isProductionEnv()) {
              await this.sns.publish(params).promise();
            }
          } catch (error) {
            this.logger.error('ERROR SMS BLAST:');
            this.logger.error(serializeError(error));
            failures++; // ? use for voiding logic if ever
          }
        };
        await this.entityManager.transaction(smsBlastTrans(message));

        broadcastSummary.broadcasts.push({
          message,
          failures,
          organization,
          invoice: enableBilling ? blastInvoice : null,
        });
        broadcastSummary.estimatedTotal += enableBilling
          ? blastInvoice.totalAmount
          : messageCountDto.count * smsCount * unitPrice;
      }
      // end-loop

      return broadcastSummary;
    } catch (error) {
      throw error;
    }
  }

  async getBroadcastMessageCount(
    organizationId?: number,
    organizationOnly?: boolean,
  ): Promise<BroadcastMessageCountDto[]> {
    try {
      if (organizationOnly && !organizationId) {
        return null;
      }
      const table = 'userMarketing';
      const query = this.entityManager
        .createQueryBuilder(UserMarketing, table)
        .select(`${table}.organization_id as "organizationId"`)
        .addSelect('COUNT(*) as "count"')
        .addSelect('organization.name as "organizationName"')
        .leftJoin(`${table}.organization`, 'organization')
        .where(`${table}.textMarketingSubscriptionArn IS NOT NULL`)
        .groupBy(`${table}.organization_id`)
        .addGroupBy('organization.id');

      if (organizationOnly && organizationId) {
        query.andWhere(`${table}.organization = :organizationId`, {
          organizationId,
        });
      }

      return query.getRawMany();
    } catch (error) {
      throw error;
    }
  }

  async getEstimatedCost(messageDto: BroadcastMessageDto): Promise<number> {
    const { message = '', organizationIds = [] } = messageDto || {};
    const messagingFee =
      this.configService.get('vendors.stripe.messagingFee') || 0;

    const receiversPromises = organizationIds.map(orgId =>
      this.getBroadcastMessageCount(orgId, !!orgId),
    );

    const receivers = (await Promise.all(receiversPromises))
      .map(e => _.first(e).count)
      .reduce((prev, curr) => Number(curr) + prev, 0);

    return this.getSMSCount(message) * receivers * messagingFee;
  }

  /**
   * Getter by EntityManager since we cannot import OrganizationModule,
   * too complex circular dependency
   */
  private async getOrganizationById(organizationId): Promise<Organization> {
    return !organizationId
      ? null
      : this.entityManager
          .createQueryBuilder(Organization, 'organization')
          .select()
          .where('id = :organizationId', {
            organizationId,
          })
          .getOne();
  }

  private composeSNSParams(
    message: string,
    organization?: Organization,
  ): SNS.Types.PublishInput {
    let topicArn: string = this.configService.get(
      'notification.aws.sns.topicArn',
    );
    // general topicArn or topicArn for organization
    if (organization && !_.isEmpty(organization.textTopicArn)) {
      topicArn = organization.textTopicArn;
    }
    return {
      Message: message,
      TopicArn: topicArn,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Promotional',
        },
      },
    };
  }

  private getSMSCount(message: string): number {
    if (!message) {
      return 0;
    }
    return Math.ceil(
      message.length /
        (message.match(GSM_CHARACTERS_REGEX)
          ? this.MESSAGE_LIMIT.GSM
          : this.MESSAGE_LIMIT.UCS2),
    );
  }
}
