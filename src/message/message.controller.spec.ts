import { Test } from '@nestjs/testing';
import { SNS } from 'aws-sdk';
import { Repository, getRepository } from 'typeorm';
import faker from 'faker';

import { AppModule } from '../app.module';
import { MessageService } from './message.service';
import { MOCK_USER_DATA } from '../../test/mocks/user.mock';
import { UserService } from '../user/user.service';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../entities/user.entity';
import { UserMarketing } from '../entities/user-marketing.entity';

jest.mock('aws-sdk');
describe('MessageController_Specs', () => {
  let messageService: MessageService;
  let userService: UserService;
  let organizationService: OrganizationService;
  let userMarketingRepository: Repository<UserMarketing>;
  let subscribe: jest.Mock;
  let unsubscribe: jest.Mock;

  beforeAll(async () => {
    subscribe = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        SubscriptionArn: 'arn:aws:sns:us-east-2:123456789012:FakeTopic',
      }),
    });

    unsubscribe = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue(true),
    });

    (SNS as any).mockImplementation(() => ({ subscribe, unsubscribe }));

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    messageService = module.get<MessageService>(MessageService);
    userService = module.get<UserService>(UserService);
    organizationService = module.get<OrganizationService>(OrganizationService);
    userMarketingRepository = getRepository<UserMarketing>(UserMarketing);

    userService.onModuleInit();
  });

  beforeEach(() => {
    // reset information like call times between each assertations
    subscribe.mockClear();
    unsubscribe.mockClear();
  });

  describe('Marketing Unit Tests', () => {
    const testUser = MOCK_USER_DATA[4]; // jortega

    it('should trigger aws.sns.subscribe on subscribe', async () => {
      const normalUser = await userService.findByEmail(testUser.email);
      const mockSubscribeData = {
        userId: normalUser.id,
        phoneNumber: testUser.mobileNumber,
        organizationId: null,
      };
      await messageService.subscribeToTextMessageMarketing(
        mockSubscribeData.userId,
        mockSubscribeData.phoneNumber,
        mockSubscribeData.organizationId,
      );

      expect(subscribe).toHaveBeenCalledTimes(1);
    });

    it('should trigger aws.sns.unsubscribe on unsubscribe', async () => {
      const normalUser = await userService.findByEmail(testUser.email);
      const mockSubscribeData = {
        userId: normalUser.id,
        phoneNumber: testUser.mobileNumber,
        organizationId: null,
      };

      await messageService.subscribeToTextMessageMarketing(
        mockSubscribeData.userId,
        mockSubscribeData.phoneNumber,
        mockSubscribeData.organizationId,
      );

      // get subscription count
      const subscriptionCount = await userMarketingRepository
        .createQueryBuilder()
        .select()
        .where('user_id = :userId', {
          userId: normalUser.id,
        })
        .andWhere('text_marketing_subscription_arn IS NOT NULL')
        .getCount();

      await messageService.unsubscribeToTextMessageMarketing(normalUser.id);

      expect(unsubscribe).toHaveBeenCalledTimes(subscriptionCount);
    });

    it('should subscribe new user to general marketing', async () => {
      const ts = +new Date(); // force milliseconds
      const newUser = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          verified: true,
          mobileNumber: '+1-777-555-0000',
        },
      };

      // register() or Sign Up has auto-subscribe to general list
      const user = await userService.register(newUser);
      expect(subscribe).toHaveBeenCalledTimes(1);

      const generalSubscription = await userMarketingRepository
        .createQueryBuilder()
        .where('user_id = :userId', {
          userId: user.id,
        })
        .andWhere('text_marketing_subscription_arn IS NOT NULL')
        .andWhere('organization_id IS NULL')
        .getOne();

      expect(generalSubscription).toBeTruthy();
      expect(generalSubscription.textMarketingSubscriptionArn).toBeTruthy();
      expect(generalSubscription.organization).toBeFalsy();
    });

    it('should update subscriptions on user phone number update', async () => {
      const normalUser = (await userService.findByEmail(
        testUser.email,
      )) as User;
      const [organizations] = await organizationService.findWithFilter();
      const organizationWithTopic = organizations.find(o => !!o.textTopicArn);

      // create mock data for subscription
      const mockSubscribeData = [
        {
          userId: normalUser.id,
          phoneNumber: testUser.mobileNumber,
          organizationId: organizationWithTopic.id,
        },
        {
          userId: normalUser.id,
          phoneNumber: testUser.mobileNumber,
          organizationId: null,
        },
      ];

      // subscribe then use data for testing.
      for (const userSubscription of mockSubscribeData) {
        await messageService.subscribeToTextMessageMarketing(
          userSubscription.userId,
          userSubscription.phoneNumber,
          userSubscription.organizationId,
        );
      }
      // clear call times from setting up data for testing
      subscribe.mockClear();
      // update the user with a new mobileNumber
      const newNumber = faker.phone.phoneNumber();
      const updateUserDto: User = {
        ...(normalUser as User),
        mobileNumber: newNumber,
      };
      await userService.update(updateUserDto);
      // then verify the phone number
      await userService.verifyMobileNumber(
        normalUser.id,
        normalUser.verificationCode,
      );

      expect(subscribe).toHaveBeenCalledTimes(mockSubscribeData.length);
      expect(unsubscribe).toHaveBeenCalledTimes(mockSubscribeData.length);
    });

    it('should also toggle subscription when toggling user status for opt-ins', async () => {
      const EXPECTED_AUTO_SUBSCRIBES = 1;
      const TOTAL_EXPECTED_UNSUBSCRIBES = 1; // deactivate-auto-unsubscribe
      const TOTAL_EXPECTED_SUBSCRIBES = 2; // auto-subscribe + resubscribe

      const ts = +new Date(); // force milliseconds
      const newUser = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Happyboi`,
          email: `user+${ts}@isbx.com`,
          password: `password`,
          verified: true,
          mobileNumber: '+1-777-555-0000',
          isSubscribedToMarketing: true,
        },
      };

      // register() or Sign Up has auto-subscribe to general list
      let user = await userService.register(newUser);
      expect(subscribe).toHaveBeenCalledTimes(EXPECTED_AUTO_SUBSCRIBES);

      // Deactivate
      user = (await userService.findById(user.id)) as User;
      expect(user.deleted).toBeFalsy();
      await userService.update({
        id: user.id,
        deleted: true,
      } as User);
      expect(unsubscribe).toHaveBeenCalledTimes(TOTAL_EXPECTED_UNSUBSCRIBES);

      // Reactivate
      user = (await userService.findById(user.id)) as User;
      expect(user.deleted).toBeTruthy();
      await userService.update({
        id: user.id,
        deleted: false,
      } as User);
      expect(subscribe).toHaveBeenCalledTimes(TOTAL_EXPECTED_SUBSCRIBES);
    });

    it('should also toggle subscription when toggling user status for opt-outs', async () => {
      const EXPECTED_AUTO_SUBSCRIBES = 1;
      const EXPECTED_USER_UNSUBSCRIBE = 1;
      const TOTAL_EXPECTED_UNSUBSCRIBES = 1; // deactivate-auto-unsubscribe

      const ts = +new Date(); // force milliseconds
      const newUser = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `No Notifs`,
          email: `user+${ts}@isbx.com`,
          password: `password`,
          verified: true,
          mobileNumber: '+1-777-555-0000',
          isSubscribedToMarketing: true,
        },
      };

      // register() or Sign Up has auto-subscribe to general list
      let user = await userService.register(newUser);
      expect(subscribe).toHaveBeenCalledTimes(EXPECTED_AUTO_SUBSCRIBES);

      // User updates profile to unsubscribe
      await userService.unsubscribeUserFromMarketing({
        id: user.id,
      } as User);
      expect(unsubscribe).toHaveBeenCalledTimes(EXPECTED_USER_UNSUBSCRIBE);

      // Deactivate - should not unsubscribe an  already-unsubscrbied user
      user = (await userService.findById(user.id)) as User;
      expect(user.deleted).toBeFalsy();
      await userService.update({
        id: user.id,
        deleted: true,
      } as User);
      expect(unsubscribe).toHaveBeenCalledTimes(EXPECTED_USER_UNSUBSCRIBE);

      // Reactivate - should still be unsubscribed
      user = (await userService.findById(user.id)) as User;
      expect(user.deleted).toBeTruthy();
      await userService.update({
        id: user.id,
        deleted: false,
      } as User);
      expect(subscribe).toHaveBeenCalledTimes(EXPECTED_AUTO_SUBSCRIBES);
      expect(unsubscribe).toHaveBeenCalledTimes(TOTAL_EXPECTED_UNSUBSCRIBES);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
