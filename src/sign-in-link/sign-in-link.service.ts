import * as log from 'fancy-log';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { SignInLink } from '../entities/sign-in-link.entity';
import { User } from '../entities/user.entity';
import {
  MailerNotification,
  NotificationService,
} from '../notification/notification.service';
import { UserService } from '../user';
import { OrganizationService } from '../organization/organization.service';
import { SignInLinkStatusDto } from './dto/sign-in-link-status.dto';

@Injectable()
export class SignInLinkService {
  constructor(
    @InjectRepository(SignInLink)
    private readonly signInLinkRepository: Repository<SignInLink>,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
  ) {}

  private stringToHex(value: string): string {
    try {
      // Utf8 to latin1
      const str = unescape(encodeURIComponent(value));
      let result = '';
      for (let i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  public generateToken(signInLink: SignInLink): string {
    try {
      return this.stringToHex(`${signInLink.id}-${signInLink.user.id}`);
    } catch (error) {
      throw error;
    }
  }

  public async getActiveByUserId(userId: number): Promise<SignInLink> {
    try {
      return this.signInLinkRepository.findOne({
        relations: ['user'],
        where: {
          user: { id: userId } as User,
          active: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public async hasRegeneratedByUserId(userId: number): Promise<boolean> {
    try {
      return !!(await this.signInLinkRepository.findOne({
        where: { user: { id: userId } as User, active: false },
      }));
    } catch (error) {
      throw error;
    }
  }

  public async getStatusByUserId(userId: number): Promise<SignInLinkStatusDto> {
    try {
      const [activeSignInLink, isRegenerated] = await Promise.all([
        this.getActiveByUserId(userId),
        this.hasRegeneratedByUserId(userId),
      ]);
      return { isActive: !!activeSignInLink, isRegenerated };
    } catch (error) {
      throw error;
    }
  }

  public async createByUserId(userId: number): Promise<SignInLink> {
    try {
      let signInLink = await this.getActiveByUserId(userId);
      if (!signInLink) {
        signInLink = await this.signInLinkRepository.save({
          token: '',
          user: { id: userId } as User,
        });
        const token = await this.generateToken(signInLink);
        await this.signInLinkRepository.update(
          { id: signInLink.id },
          { token },
        );
        signInLink.token = token;
      }
      return signInLink;
    } catch (error) {
      throw error;
    }
  }

  public async generateSignInLinks(users: User[]): Promise<boolean[]> {
    try {
      return Promise.all(
        users.map(async user => {
          const signInLink = await this.createByUserId(user.id);
          return this.sendSignInLinkEmail(signInLink);
        }),
      );
    } catch (error) {
      throw error;
    }
  }

  public async sendVerificationEmail(email: string): Promise<boolean> {
    try {
      // TODO: potential inclusion of normal users
      const user = await this.userService.findByEmail(email);
      const isExternalUser = await this.userService.hasExternalAccount(email);

      if (user && isExternalUser) {
        // send only for mj/biotrack user with existing GD accounts
        const signInLink = await this.createByUserId(user.id);
        return this.sendSignInLinkEmail(signInLink);
      }
      return;
    } catch (error) {
      throw error;
    }
  }

  private async sendSignInLinkEmail(signInLink: SignInLink): Promise<boolean> {
    try {
      const userId = signInLink.user.id;

      const clientBaseUrl: string = this.configService.get(
        'email.clientBaseUrl',
      );
      const signInLinkUrl = `${clientBaseUrl}/in?token=${signInLink.token}`;

      const forUser = (await this.userService.findById(userId)) as User;
      const fromAddress = this.configService.get('email.from');
      if (!fromAddress) {
        log.error(
          'Error: no app email found in configuration. Please check your "email.from" config.',
        );
      }

      const organizations = await this.organizationService.getFreewayBiotrackUserOrganizations(
        forUser.email,
      );
      const organizationNames =
        organizations && organizations.map(org => org.name);

      const subject = `${organizationNames.join(
        ', ',
      )} se ha asociado con GreenDirect`;

      const mailOptions: MailerNotification = {
        subject,
        from: fromAddress,
        to: forUser.email,
        template: 'sign-in-link',
        context: { forUser, organizationNames, signInLinkUrl, clientBaseUrl },
      };

      return new Promise<boolean>((resolve, reject) => {
        this.notificationService
          .sendEmailMessage(mailOptions, forUser.locale)
          .then(data => resolve(true))
          .catch(error => {
            log.error(error.stack);
            resolve(true);
          });
      });
    } catch (error) {
      throw error;
    }
  }

  public async revokeByUserId(userId: number): Promise<void> {
    try {
      const signInLink = await this.signInLinkRepository.findOne({
        where: { user: { id: userId } as User, active: true },
      });
      if (signInLink) {
        signInLink.active = false;
        await this.signInLinkRepository.save({
          id: signInLink.id,
          active: false,
        });
      }
    } catch (error) {
      throw error;
    }
  }
}
