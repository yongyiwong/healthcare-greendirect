import Hashids from 'hashids';
import { EMPTY, from, of } from 'rxjs';
import { catchError, concatMap, last, switchMap } from 'rxjs/operators';
import { EntityManager } from 'typeorm';

import {
  HttpService,
  Injectable, LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@sierralabs/nest-utils';
import { NotificationService } from '../notification/notification.service';
import serializeError = require('serialize-error');
import { httpConfig } from '../common/http.config';
import {GreenDirectLogger} from '../greendirect-logger';

export enum AutomatedEmailType {
  DailyEmails = 'daily',
  WeeklyEmails = 'weekly',
}

interface CampaignMonitorUser {
  freewayId: number;
  firstName: string;
  lastName: string;
  email: string;
  totalPoints?: number;
}

const BASE_URL = 'https://api.createsend.com/api/v3.2/transactional/smartEmail';
@Injectable()
export class CampaignMonitorService {
  logText = '';
  // tslint:disable-next-line:max-line-length
  auth =
    'Basic c0tVTGh3WlM4dkNXREUxSEVEeXJ2S1lBekRzeHBXeVNWV3hiamxxMUJSNDc3UHlwTnA0TlBmSDFNOG9SMENiLzJCdGYyUnVURmVvRHNuQzRBZ2dJZzFqTkFuRXMvWjcyZGRzTTNSdExFZkVEdXdyUnF2UVhtY3djRmFWOXVZS1ZZSWd1Z2NxVC9HSEVORkw3UG1vdjhnPT06';
  private logger: LoggerService = new GreenDirectLogger('CampaignMonitorService');

  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly notificationService: NotificationService,
  ) {
  }

  public async sendAutomatedEmails(automatedEmailType: AutomatedEmailType) {
    this.logger.log('sending automated emails');
    const startTime = new Date();
    switch (automatedEmailType) {
      case AutomatedEmailType.WeeklyEmails:
        await this.sendWeeklyPointsReminder();
        break;
      case AutomatedEmailType.DailyEmails:
        await this.sendPreBirthdayEmail();
        await this.sendBirthdayEmail();
        await this.sendFortyFiveDaysOfflineEmail();
        await this.sendNinetyDaysOfflineEmail();
        await this.sendMedicalExpirySoonEmail();
        break;
    }
    const elapseTime = this.getTimeDiff(startTime);
    this.logger.log(
      `finished sending automated ${automatedEmailType} emails (${elapseTime}s)`,
    );
    return this.sendLog(automatedEmailType);
  }

  public async sendPreBirthdayEmail() {
    const startQueryTime = new Date();
    const emailId = '4e787788-1f6c-4846-a7bd-db48d71cd224';
    const queryString = `
      SELECT pos_id as "freewayId", first_name as "firstName", last_name as "lastName", email FROM freeway_user
      WHERE DATE_PART('day', birthday) = date_part('day', CURRENT_DATE + INTERVAL '4 day')
      AND DATE_PART('month', birthday) = date_part('month', CURRENT_DATE + INTERVAL '4 day')
      AND org_id = 207
      AND email IS NOT NULL AND email != '' AND active = TRUE AND unsubscribed = false
      `;
    const users = (await this.entityManager.query(
      queryString,
    )) as CampaignMonitorUser[];
    const elapseTime = this.getTimeDiff(startQueryTime);
    this.logger.log(
      `Pre-birthday email fetched ${users.length} users (${elapseTime}s)`,
    );
    return this.sendUsersToCampaignMonitor(emailId, users);
  }

  public async sendBirthdayEmail() {
    const startQueryTime = new Date();
    const emailId = '2f289925-32a8-4ec2-85cd-7b7b25d7c8fc';
    const queryString = `
      SELECT pos_id as "freewayId", first_name as "firstName", last_name as "lastName", email FROM freeway_user
      WHERE DATE_PART('day', birthday) = date_part('day', CURRENT_DATE)
      AND DATE_PART('month', birthday) = date_part('month', CURRENT_DATE)
      AND org_id = 207
      AND email IS NOT NULL AND email != '' AND active = TRUE AND unsubscribed = false
      `;
    const users = (await this.entityManager.query(
      queryString,
    )) as CampaignMonitorUser[];
    const elapseTime = this.getTimeDiff(startQueryTime);
    this.logger.log(
      `Birthday email fetched ${users.length} users (${elapseTime}s)`,
    );
    return this.sendUsersToCampaignMonitor(emailId, users);
  }

  public async sendFortyFiveDaysOfflineEmail() {
    const startQueryTime = new Date();
    const emailId = '0cc3521d-ea9b-4593-9b62-ab82f2aff77e';
    const queryString = `
    SELECT pos_id as "freewayId", first_name as "firstName", last_name as "lastName", email FROM freeway_user
    WHERE DATE_PART('day',current_date - modified) = 45
    AND org_id = 207
    AND email is NOT NULL and email != '' AND active = true AND unsubscribed = false
    `;
    const users = (await this.entityManager.query(
      queryString,
    )) as CampaignMonitorUser[];
    const elapseTime = this.getTimeDiff(startQueryTime);
    this.logger.log(
      `45 days offline email fetched ${users.length} users (${elapseTime}s)`,
    );
    return this.sendUsersToCampaignMonitor(emailId, users);
  }

  public async sendNinetyDaysOfflineEmail() {
    const startQueryTime = new Date();
    const emailId = '0cc3521d-ea9b-4593-9b62-ab82f2aff77e';
    const queryString = `
    SELECT pos_id as "freewayId", first_name as "firstName", last_name as "lastName", email FROM freeway_user
    WHERE DATE_PART('day',current_date - modified) = 90
    AND org_id = 207
    AND email is NOT NULL and email != '' AND active = true AND unsubscribed = false
    `;
    const users = (await this.entityManager.query(
      queryString,
    )) as CampaignMonitorUser[];
    const elapseTime = this.getTimeDiff(startQueryTime);
    this.logger.log(
      `90 days offline email fetched ${users.length} users (${elapseTime}s)`,
    );
    return this.sendUsersToCampaignMonitor(emailId, users);
  }

  public async sendMedicalExpirySoonEmail() {
    const startQueryTime = new Date();
    const emailId = '52538a70-7daa-46e5-b17e-4ced30141483';
    const queryString = `
    SELECT freeway_user.pos_id as "freewayId", first_name as "firstName", last_name as "lastName", email FROM freeway_user
    INNER JOIN freeway_user_identification ON freeway_user.pos_id = freeway_user_identification.freeway_user_id
    WHERE "freeway_user_identification"."type" = 'med'
    AND date_part('day', freeway_user_identification.expires - Current_date) = 30
    AND freeway_user.org_id = 207
    AND email is NOT NULL and email != '' AND freeway_user.active = true AND unsubscribed = false
    `;
    const users = (await this.entityManager.query(
      queryString,
    )) as CampaignMonitorUser[];
    const elapseTime = this.getTimeDiff(startQueryTime);
    this.logger.log(
      `Medical ID reminder email fetched ${users.length} users (${elapseTime}s)`,
    );
    return this.sendUsersToCampaignMonitor(emailId, users);
  }

  public async sendWeeklyPointsReminder() {
    const startQueryTime = new Date();
    const emailId = '2abd690f-2b3c-49b2-ab2a-d2818dd2ef5f';
    const queryString = `
    SELECT pos_id as "freewayId", first_name as "firstName", last_name as "lastName", email, total_points as "totalPoints" FROM freeway_user
    WHERE email is NOT NULL and email != '' AND active = true AND unsubscribed = false AND has_bwell = true AND org_id = 207
    `;
    const users = (await this.entityManager.query(
      queryString,
    )) as CampaignMonitorUser[];
    const elapseTime = this.getTimeDiff(startQueryTime);
    this.logger.log(
      `Weekly points reminder email fetched ${users.length} users (${elapseTime}s)`,
    );
    return this.sendUsersToCampaignMonitor(emailId, users);
  }

  private encodeFreewayId(freewayId: number) {
    const hashids = new Hashids(this.configService.get('salt'));
    const hash = hashids.encode([freewayId, +new Date()]);
    return hash;
  }

  private decodeFreewayId(hash: string) {
    try {
      const hashids = new Hashids(this.configService.get('salt'));
      const decodeHash = hashids.decode(hash);
      return parseInt(decodeHash[0], 10);
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  public async unsubscribeUser(hash: string) {
    try {
      const freewayId = this.decodeFreewayId(hash);
      const query = `SELECT EXISTS(SELECT 1 FROM freeway_user WHERE pos_id = $1)`;
      const user = await this.entityManager.query(query, [freewayId]);
      if (user[0].exists) {
        const queryString = `UPDATE freeway_user SET unsubscribed = true WHERE pos_id = $1`;
        await this.entityManager.query(queryString, [freewayId]);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  public async subscribeUser(hash: string) {
    const freewayId = this.decodeFreewayId(hash);
    const query = `SELECT EXISTS(SELECT 1 FROM freeway_user WHERE pos_id = $1)`;
    const user = await this.entityManager.query(query, [freewayId]);
    if (user[0].exists) {
      const queryString = `UPDATE freeway_user SET unsubscribed = false WHERE pos_id = $1`;
      await this.entityManager.query(queryString, [freewayId]);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Helper method for send email to users via campaign monitor
   * @param emailId
   * @param users
   */
  private async sendUsersToCampaignMonitor(
    emailId: string,
    users: CampaignMonitorUser[],
  ) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `Non-production environment. Skip sending ${users.length} e-mails.`,
      );
      return { successful: true };
    }
    return new Promise(async (resolve, reject) => {
      const startTime = new Date();
      from(users)
        .pipe(
          concatMap(user => {
            const code = this.encodeFreewayId(user.freewayId);
            const apiPath = `${BASE_URL}/${emailId}/send`;
            const postBody = {
              To: `${user.firstName} ${user.lastName} <${user.email}>`,
              ConsentToTrack: 'Yes',
              Data: {
                FullName: `${user.firstName} ${user.lastName}`,
                TotalPoints: user.totalPoints,
                UnsubUrl: `http://greendirect.com/unsubscribe/${code}`,
              },
            };
            // if campaign monitor error send email notification and recover (continue sending e-mails)
            return of(user).pipe(
              switchMap(() => {
                return this.httpService.post(
                  apiPath,
                  postBody,
                  this.getHttpConfig(),
                );
              }),
              catchError(async error => {
                this.logger.log(`Error from campaign monitor`);
                this.logger.error(serializeError(error));
                await this.sendErrorNotificationEmail(
                  'GreenDirect: Campaign Monitor Error',
                  error,
                );
                return EMPTY;
              }),
            );
          }),
          last(),
        )
        .subscribe(
          results => {
            const elapseTime = this.getTimeDiff(startTime);
            this.logger.log(
              `sent emails to ${users.length} users (${elapseTime}s)`,
            );
            resolve({ successful: true });
          },
          error => {
            this.logger.log(`Error in sendUsersToCampaignMonitor`);
            this.logger.error(error);
            reject(error);
          },
        );
    });
  }

  /**
   * Helper method for getting the Axios HTTP config
   */
  private getHttpConfig() {
    return {
      baseURL: BASE_URL,
      headers: {
        ...httpConfig.headers,
        // tslint:disable-next-line
        Authorization: this.auth,
        'Content-Type': 'application/json',
      },
    };
  }

  private getTimeDiff(startTime: Date): number {
    const endTime = new Date();
    return (endTime.getTime() - startTime.getTime()) / 1000;
  }

  async sendLog(automatedEmailType: AutomatedEmailType) {
    if (process.env.SEND_EMAIL === '1') {
      return this.notificationService.sendEmail({
        from: this.configService.get('email.from'),
        to: this.configService.get('email.techSupport'),
        subject: `GreenDirect: Automated ${automatedEmailType} e-mail status report`,
        message: `Automated ${automatedEmailType} e-mails sent: \n\n${this.logText}`,
      });
    }
  }

  async sendErrorNotificationEmail(subject: string, error: Error) {
    const configService = new ConfigService();
    await this.notificationService.sendEmail({
      from: configService.get('email.from'),
      to: configService.get('email.techSupport'),
      subject,
      message:
        'An error occurred:\n' + JSON.stringify(serializeError(error), null, 2),
    });
  }
}
