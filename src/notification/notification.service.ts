import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@sierralabs/nest-utils';
import * as log from 'fancy-log';
import * as _ from 'lodash';
import { MailerService } from '@nest-modules/mailer';
import { isProductionEnv, Environments } from '../app.service';

export enum NotificationMethod {
  SMS = 'sms',
  EMAIL = 'email',
}

export interface EmailNotification {
  from: string;
  to: string;
  subject: string;
  message: string;
}

export interface TextMessageNotification {
  phoneNumber: string;
  message: string;
}

export interface MailerNotification {
  from: string;
  to: string;
  subject: string;
  /** .pug template filename */
  template: string;
  /** key-value variables to pass to template */
  context: { [k: string]: any };
}

@Injectable()
export class NotificationService {
  readonly localedContactName = {
    'en-US': 'GreenDirect Notifications',
    'es-PR': 'GreenDirect Notificaciones',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    const config = configService.get('client.aws');
    AWS.config.update({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: 'us-west-2',
    });
  }

  /**
   * @param options - accepts same fields as https://nodemailer.com/message/
   */
  public async sendEmailMessage(options: any, locale: string = 'en-US') {
    // no need to await, just fire and forget
    options.template = `${locale}_${options.template}`;

    // if there is no < symbol like "Contact Name <email@some.thing>", append Contact Name
    if ((options.from + '').indexOf('<') < 0) {
      options.from = `${this.localedContactName[locale]} <${options.from}>`;
    }

    try {
      this.mailerService.sendMail(options);
      return Promise.resolve(true);
    } catch (error) {
      log.error(error);
    }
  }

  /**
   * @deprecated use sendEmailMessage() instead
   */
  public async sendEmail(emailNotification: EmailNotification): Promise<any> {
    const params = {
      Destination: {
        ToAddresses: [emailNotification.to],
      },
      Message: {
        Body: {
          // Html: {
          //  Charset: "UTF-8",
          //  Data: "HTML_FORMAT_BODY"
          // },
          Text: {
            Charset: 'UTF-8',
            Data: emailNotification.message,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: emailNotification.subject,
        },
      },
      Source: emailNotification.from,
    };

    log.info('Notification Service: AWS SES send email');
    return new AWS.SES({ apiVersion: '2010-12-01' })
      .sendEmail(params)
      .promise();
  }

  public async sendTextMessage(
    textMessageNotification: TextMessageNotification,
  ): Promise<any> {
    // Send SMS only when in staging or production
    if (isProductionEnv()) {
      // Check if multiple phone numbers comma separated
      const phoneNumbers = textMessageNotification.phoneNumber.split(',');
      for (const phoneNumber of phoneNumbers) {
        const environments = ['staging', 'production'];
        if (
          !_.includes(environments, process.env.NODE_ENV) ||
          (_.includes(environments, process.env.NODE_ENV) &&
            phoneNumber &&
            phoneNumber.trim().indexOf('+1') === 0)
        ) {
          const params = {
            Message: textMessageNotification.message,
            PhoneNumber: phoneNumber,
          } as AWS.SNS.PublishInput;
          log.info(params);
          await new AWS.SNS({ apiVersion: '2010-03-31' })
            .publish(params)
            .promise();
        } else {
          await this.sendEmail({
            from: this.configService.get('email.from'),
            to: this.configService.get('email.techSupport'),
            subject: 'GreenDirect: Invalid Phone Number ' + phoneNumber,
            message: `GreenDirect attempted to send the following message to ${phoneNumber}:\n\n${textMessageNotification.message}`,
          });
        }
      }
    }
    return;
  }
}
