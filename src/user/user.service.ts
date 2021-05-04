import * as bcrypt from 'bcrypt';
import { differenceInMinutes } from 'date-fns';
import * as log from 'fancy-log';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import PhoneNumber from 'awesome-phonenumber';
import { OrderByCondition, Repository, UpdateResult } from 'typeorm';
import isMobilePhone from 'validator/lib/isMobilePhone';

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AuthService,
  JwtPayload,
  JwtToken,
  User as BaseUser,
  UserService as BaseUserService,
} from '@sierralabs/nest-identity';
import { ConfigService } from '@sierralabs/nest-utils';

import { MessageService } from '../message/message.service';
import { UserAddress } from '../entities/user-address.entity';
import { UserIdentification } from '../entities/user-identification.entity';
import { UserLocation } from '../entities/user-location.entity';
import { User } from '../entities/user.entity';
import { GDExpectedException } from '../gd-expected.exception';
import {
  NotificationService,
  MailerNotification,
} from '../notification/notification.service';
import { RoleEnum } from '../roles/roles.enum';
import { RolesService } from '../roles/roles.service';
import { UserExceptions } from './user.exceptions';
import { isNonProduction, Environments } from '../app.service';
import { UserRoleService } from '../user-role/user-role.service';
import { OrganizationService } from '../organization/organization.service';
import { Organization } from '../entities/organization.entity';
import { SignInLinkExceptions } from '../sign-in-link/sign-in-link.exceptions';
import { FreewayUser } from '../entities/freeway-user.entity';
import { BiotrackUser } from '../entities/biotrack-user.entity';

// matches user@email.com but not user@email even if its valid email
export const REGEX_TLD_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const REGEX_PATIENT_NUMBER = /^PA18-[0-9]{8}$/;
const REGEX_ALL_SPACES = /\s+/g;
const PHONENUMBER_CONFIG = {
  locale: 'en-US',
  countryCode: '1',
  regionCode: 'US',
};

Injectable();
export class UserService extends BaseUserService {
  constructor(
    @InjectRepository(User) protected readonly userRepository: Repository<User>,
    @InjectRepository(UserAddress)
    protected readonly userAddressRepository: Repository<UserAddress>,
    @InjectRepository(UserIdentification)
    protected readonly userIdentificationRepository: Repository<
      UserIdentification
    >,
    protected readonly configService: ConfigService,
    @Inject(NotificationService)
    protected readonly notificationService: NotificationService,
    protected readonly moduleRef: ModuleRef,
    protected readonly authService: AuthService,
    protected readonly messageService: MessageService,
    protected readonly rolesService: RolesService,
    protected readonly userRoleService: UserRoleService,
    protected readonly organizationService: OrganizationService,
  ) {
    super(userRepository, configService, rolesService, moduleRef);
  }

  public async createToken(
    user: JwtPayload,
    expiresIn: string,
  ): Promise<JwtToken> {
    const secret =
      this.configService.get('jwt.secret') || process.env.JWT_SECRET;
    const accessToken = jwt.sign(user, secret, { expiresIn });
    return { expiresIn, accessToken };
  }

  public async verifyToken(token: string): Promise<any> {
    const secret =
      this.configService.get('jwt.secret') || process.env.JWT_SECRET;
    let tokenInfo;
    try {
      GDExpectedException.try(UserExceptions.tokenRequired, token);
      // Token present, so try with jwt verify
      tokenInfo = jwt.verify(token, secret);
    } catch (error) {
      if (UserExceptions.tokenInvalid.failCondition(error)) {
        throw new GDExpectedException(UserExceptions.tokenInvalid);
      } else if (UserExceptions.tokenExpired.failCondition(error)) {
        throw new GDExpectedException(UserExceptions.tokenExpired);
      } else if (UserExceptions.secretMisMatched.failCondition(error)) {
        throw new GDExpectedException(UserExceptions.secretMisMatched);
      }
      throw error;
    }
    return tokenInfo;
  }

  public async update(user: User): Promise<User> {
    user.id = Number(user.id); // fix for GD-125 id passed as string

    /**
     * Due to the bug that the "verified" property is always included by the base userController
     * even if we don't need to update it, it resets the verified status.
     * So we manually remove it if it's false, and recheck it with
     * any change for mobile number.
     *
     * else if "verified" is already true, let's allow that update
     * (i.e. from verifyPhone())
     */
    if (!user.verified) {
      delete user.verified; // remove to be rechecked
    }
    if (user.patientNumber) {
      if (!REGEX_PATIENT_NUMBER.test(user.patientNumber)) {
        throw new GDExpectedException(UserExceptions.patientNumberFailed);
      }
    }

    try {
      const userToUpdate = await this.checkResetVerifiedStatus(user);
      const isStatusBeingToggled = await this.isUserStatusBeingToggled(user);

      // NOTE: the nest-identity update() result is incomplete (GD-added properties not included)
      const updatedUser = (await super.update(userToUpdate)) as User;

      // After-update operations
      if (isStatusBeingToggled) {
        await this.toggleUserSubscriptions(updatedUser.id);
      }

      return updatedUser;
    } catch (error) {
      const { accountExists } = UserExceptions;
      if (accountExists.failCondition(error)) {
        GDExpectedException.throw(accountExists);
      } else {
        throw error;
      }
    }
  }

  public async create(user: User) {
    let newUser: User = null;
    try {
      newUser = (await super.create(user)) as User;
    } catch (error) {
      if (UserExceptions.accountExists.failCondition(error)) {
        throw new GDExpectedException(UserExceptions.accountExists);
      }
      throw error;
    }
    return Promise.resolve(newUser);
  }

  public async register(user: User) {
    try {
      if (user.patientNumber) {
        if (!REGEX_PATIENT_NUMBER.test(user.patientNumber)) {
          throw new GDExpectedException(UserExceptions.patientNumberFailed);
        }
      }

      user = (await super.register(user as BaseUser)) as User;
      user = await this.subscribeUserToMarketing(user);
    } catch (error) {
      if (UserExceptions.requiredPropertiesMissing.failCondition(error)) {
        GDExpectedException.throw(UserExceptions.requiredPropertiesMissing);
      } else if (UserExceptions.accountExists.failCondition(error)) {
        GDExpectedException.throw(UserExceptions.accountExists);
      }
      throw error;
    }
    return user;
  }

  public async login(email: string, password: string) {
    try {
      const user = await this.findByEmail(email, {
        selectPassword: true,
      });
      if (!(user && user.password)) {
        // arbitrary bcrypt.compare to prevent(?) timing attacks. Both good/bad paths take
        // roughly the same amount of time
        await bcrypt.compare(
          '1234567890',
          '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW',
        );
        throw new UnauthorizedException();
      }
      return await super.login(email, password);
    } catch (error) {
      // rewraps the error from nest-identity for consistency
      throw new GDExpectedException(UserExceptions.loginFailed);
    }
  }
  /* end of overrides */

  public async composeResetPasswordEmail(
    forUser: User,
    locale: string = 'en-US',
  ): Promise<MailerNotification> {
    if (!forUser || !forUser.email) {
      log.error(
        `Error: No "to" email provided. Cannot send email to user: ${forUser.id}.`,
      );
    }
    const localedEmailSubject = {
      'en-US': 'GreenDirect: Password Reset ',
      'es-PR': 'GreenDirect: restablecimiento de contraseña ',
    };
    const clientBaseUrl = this.configService.get('email.clientBaseUrl');
    const fromAddress = this.configService.get('email.from'); // official app email address
    if (!fromAddress) {
      log.error(
        'Error: no app email found in configuration. Please check your "email.from" config.',
      );
    }
    const DEFAULT_TOKEN_EXPIRY = { value: '10m', description: 'ten minutes' };
    // TODO: TEST if this does expire,
    // TODO: translation for the description?
    const token = await this.createToken(
      { userId: forUser.id, email: forUser.email } as JwtPayload,
      DEFAULT_TOKEN_EXPIRY.value,
    );
    const urlPath = `${clientBaseUrl}/login/reset-password?token=${token.accessToken}`;

    const email: MailerNotification = {
      subject: localedEmailSubject[locale],
      from: fromAddress,
      to: forUser.email,
      template: 'password-reset',
      context: { forUser, urlPath, expiry: DEFAULT_TOKEN_EXPIRY.description },
    };
    return new Promise<MailerNotification>(resolve => resolve(email));
  }

  private async checkResetVerifiedStatus(user: User) {
    const oldUser = (await this.findById(user.id)) as User;

    // As part fix for update(), let's revert the old verified as baseline
    if (!user.hasOwnProperty('verified')) {
      user.verified = oldUser.verified;
    }

    // fix can't updated deleted property via update service method
    if (!user.hasOwnProperty('deleted')) {
      user.deleted = oldUser.deleted;
    }

    // now the correct logic for setting verified if mobile data is changed
    // assuming mobileNumber is provided, need to reverify
    if (
      user.hasOwnProperty('mobileNumber') &&
      user.mobileNumber !== oldUser.mobileNumber
    ) {
      user.verified = false;
    }

    // userController.verifyPhone will toggle verified to true and
    // honored by update()
    return user;
  }

  public async updatePassword(
    oldPassword: string,
    newPassword: string,
    email: string,
  ): Promise<User> {
    let user = await this.findByEmail(email, {
      selectPassword: true,
    });
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new GDExpectedException(UserExceptions.passwordIncorrect);
    }
    user = await this.changePassword(user, newPassword);
    const result = await this.update(user as User);
    await this.authService.createToken(user.id, user.email);
    return result;
  }

  public async setPassword(email: string, password: string): Promise<any> {
    try {
      let user = await this.findByEmail(email, {
        selectPassword: true,
      });
      GDExpectedException.try(UserExceptions.userNotFound, user);

      user = await this.changePassword(user, password);
      const result = await this.update(user as User);
      await this.authService.createToken(user.id, user.email);
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async generateVerificationCode(userId: number): Promise<string> {
    const user = (await this.findById(userId)) as User;
    const codeLength = 4;
    const minMinutesBeforeRegen = 5;
    const minutesPassed = differenceInMinutes(
      new Date(),
      user.verificationCreated,
    );
    let verificationCode = '';

    if (!user.verificationCreated || minutesPassed >= minMinutesBeforeRegen) {
      // create new code if past min minutes
      const possibleCharacters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
      for (let i = 0; i < codeLength; i++) {
        verificationCode += possibleCharacters.charAt(
          Math.floor(Math.random() * possibleCharacters.length),
        );
      }
      user.verificationCode = verificationCode;
      user.verificationCreated = new Date();
      user.modifiedBy = userId;
      user.verified = false;
      this.update(user);
    } else {
      // just reuse the code
      verificationCode = user.verificationCode;
    }
    return verificationCode;
  }

  public async sendValidationCodeEmail(
    forUser: User,
    verificationCode: string,
    locale: string = 'en-US',
  ): Promise<boolean> {
    if (!forUser || !forUser.email) {
      log.error(
        `Error: No "to" email provided. Cannot send email to user: ${forUser.id}.`,
      );
    }
    const fromAddress = this.configService.get('email.from'); // official app email address
    if (!fromAddress) {
      log.error(
        'Error: no app email found in configuration. Please check your "email.from" config.',
      );
    }
    const localedEmailSubject = {
      'en-US': 'GreenDirect: Verification Code ',
      'es-PR': 'GreenDirect: Código de Verificación ',
    };

    const mailOptions: MailerNotification = {
      from: fromAddress,
      to: forUser.email,
      subject: localedEmailSubject[locale],
      template: 'verify-by-email',
      context: { forUser, fromAddress, verificationCode },
    };

    return new Promise<boolean>((resolve, reject) => {
      this.notificationService
        .sendEmailMessage(mailOptions, forUser.locale)
        .then(data => resolve(true))
        .catch(error => {
          log.error(error.stack);
          resolve(true); // always resolve true to prevent spoofing attacks
        });
    });
  }

  public validateVerificationCode(user: User, verificationCode: string) {
    const DEFAULT_OVERRIDE = '0000';
    return (
      verificationCode.toUpperCase() === user.verificationCode ||
      (isNonProduction(
        // for development/test environments, allow the DEFAULT
        { includes: [Environments.TEST] },
      ) &&
        verificationCode === DEFAULT_OVERRIDE)
    );
  }

  public async getUsersReportReviewNotif(locationId: number): Promise<User[]> {
    let result = null;
    try {
      result = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.assignments', 'assignments')
        .leftJoin('user.roles', 'role')
        .where('role.name = :role1', { role1: RoleEnum.Admin })
        .orWhere(
          '(role.name = :role2 AND assignments.location_id = :locationId)',
          { locationId, role2: RoleEnum.SiteAdmin },
        )
        .orWhere(
          '(role.name = :role3 AND assignments.location_id = :locationId)',
          { locationId, role3: RoleEnum.Employee },
        )
        .getMany();
    } catch (error) {
      throw error;
    }
    return new Promise<User[]>(resolve => resolve(result));
  }

  public async getUserAddresses(userId: number): Promise<UserAddress[]> {
    try {
      return this.userAddressRepository.find({
        where: { userId, isActive: true },
        order: { modified: 'DESC' },
      });
    } catch (error) {
      throw error;
    }
  }

  public async getUserAddressById(
    userId: number,
    addressId: number,
  ): Promise<UserAddress> {
    try {
      const result = await this.userAddressRepository.findOne({
        id: addressId,
        userId,
      });
      GDExpectedException.try(UserExceptions.userAddressNotFound, result);
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async createUserAddress(
    userAddress: UserAddress,
  ): Promise<UserAddress> {
    try {
      const addresses = await this.getUserAddresses(userAddress.userId);
      GDExpectedException.try(
        UserExceptions.maxAddressNumExceeded,
        addresses.length,
      );
      if (userAddress.isPrimary) {
        await this.setOtherAddressesNotPrimary(userAddress.userId);
      }
      return this.userAddressRepository.save(userAddress);
    } catch (error) {
      throw error;
    }
  }

  public async updateUserAddress(
    userAddress: UserAddress,
  ): Promise<UserAddress> {
    try {
      if (userAddress.isPrimary) {
        await this.setOtherAddressesNotPrimary(userAddress.userId);
      }
      delete userAddress.createdBy;
      return this.userAddressRepository.save(userAddress);
    } catch (error) {
      throw error;
    }
  }

  public async deleteUserAddress(
    userId: number,
    addressId: number,
  ): Promise<UpdateResult> {
    try {
      return this.userAddressRepository.update(
        { id: addressId, userId },
        { isActive: false, modifiedBy: userId },
      );
    } catch (error) {
      throw error;
    }
  }

  public async getIdentification(
    userId: number,
    locationId: number,
  ): Promise<UserIdentification> {
    return this.userIdentificationRepository
      .createQueryBuilder('user_identification')
      .where('user_id = :userId AND location_id = :locationId', {
        userId,
        locationId,
      })
      .getOne();
  }

  public async getAssignedUsers(
    userId: number,
    search?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
    includeDeleted?: boolean,
  ): Promise<[User[], number]> {
    const offset = page * limit;
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role')
        .leftJoin('user.locations', 'location')
        .where(queryBuilder => {
          const subQuery = queryBuilder
            .subQuery()
            .select(['userLocation.location_id'])
            .from(UserLocation, 'userLocation')
            .where('userLocation.user_id = :userId', { userId })
            .andWhere('userLocation.deleted = false')
            .groupBy('userLocation.location_id')
            .getQuery();
          return 'location.location_id IN ' + subQuery;
        })
        .andWhere('location.deleted = false');
      if (search) {
        const spacesAsWildcardsTerm = search
          .trim()
          .replace(REGEX_ALL_SPACES, '%');
        const filter = '%' + spacesAsWildcardsTerm + '%';
        query.andWhere(
          `((user.id)::text ILIKE :filter OR
          email ILIKE :filter OR
          first_name ILIKE :filter OR
          last_name ILIKE :filter OR
          CONCAT(first_name, last_name) ILIKE :filter)`,
          { filter },
        );
      }
      query.take(limit).skip(offset);
      if (order) {
        const key = Object.keys(order)[0];
        order['user.' + key] = order[key];
        delete order[key];
        query.orderBy(order);
      }
      if (!includeDeleted) {
        query.andWhere('user.deleted = false');
      }
      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  public async getAssignableOrganizationUsers(
    organizationId: number,
    role?: RoleEnum,
    search: string = '',
    page: number = 0,
    limit: number = 100,
    order: string = 'name ASC',
  ): Promise<[User[], number]> {
    try {
      const filter = '%' + search + '%';
      const offset = page * limit;
      const query = this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .leftJoin(
          'user.assignments',
          'assignments',
          'assignments.deleted = false AND assignments.location IS NOT NULL',
        )
        .leftJoin('assignments.location', 'location')
        .leftJoin('location.organization', 'organization')
        .andWhere(
          '(organization.id = :organizationId OR organization.id IS NULL)',
          {
            organizationId,
          },
        );

      if (role) {
        query.andWhere('role.name = :role', { role });
      }
      if (search) {
        query.andWhere(
          `CONCAT(user.firstName, ' ', user.lastName) ILIKE :filter`,
          { filter },
        );
      }

      if (order) {
        const [column, value = 'ASC'] = order.split(' ');
        const orderValue = value.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (column === 'name') {
          query.orderBy({
            ['user.firstName']: orderValue,
            ['user.lastName']: orderValue,
          });
        } else {
          query.orderBy('user.' + column, orderValue);
        }
      }

      query.take(limit).skip(offset);

      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  public async getAssignedOrganizationUsers(
    organizationId: number,
    role?: RoleEnum,
    order: string = 'name ASC',
  ): Promise<[User[], number]> {
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .innerJoin(
          'user.assignments',
          'assignments',
          'assignments.deleted = false',
        )
        .innerJoin('assignments.location', 'location')
        .innerJoin('location.organization', 'organization')
        .andWhere('organization.id = :organizationId', {
          organizationId,
        });

      if (role) {
        query.andWhere('role.name = :role', { role });
      }

      if (order) {
        const [column, value = 'ASC'] = order.split(' ');
        const orderValue = value.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (column === 'name') {
          query.orderBy({
            ['user.firstName']: orderValue,
            ['user.lastName']: orderValue,
          });
        } else {
          query.orderBy('user.' + column, orderValue);
        }
      }
      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  public async findWithFilter(
    order: OrderByCondition,
    limit: number = 100,
    offset: number = 0,
    search: string = '',
    fields?: string[],
    includeDeleted?: boolean,
  ): Promise<[User[], number]> {
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles');

      if (search) {
        const spacesAsWildcardsTerm = search
          .trim()
          .replace(REGEX_ALL_SPACES, '%');
        const filter = '%' + spacesAsWildcardsTerm + '%';
        query.andWhere(
          `((user.id)::text ILIKE :filter OR
          email ILIKE :filter) OR
          first_name ILIKE :filter OR
          last_name ILIKE :filter OR
          CONCAT(first_name, last_name) ILIKE :filter`,
          { filter },
        );
      }

      if (!includeDeleted) {
        query.andWhere('user.deleted = false');
      }
      query
        .orderBy(order)
        .limit(limit)
        .offset(offset);
      const count = await query.getCount();
      const users = await query.getMany();
      return Promise.resolve([users, count]) as Promise<[User[], number]>;
    } catch (error) {
      throw error;
    }
  }

  public async findByMobileNumber(mobileNumber: string): Promise<User> {
    try {
      GDExpectedException.try(
        UserExceptions.mobileNumberRequired,
        mobileNumber,
      );
      const query = this.userRepository.createQueryBuilder('user');
      query.where('TRIM(user.mobileNumber) = TRIM(:mobileNumber)', {
        mobileNumber,
      });
      return query.getOne();
    } catch (error) {
      throw error;
    }
  }

  public async verifyMobileNumber(
    userId: number,
    verificationCode?: string,
  ): Promise<boolean> {
    const user = (await this.findById(userId)) as User;
    const mobileNumber = user.mobileNumber;

    if (verificationCode) {
      if (!this.validateVerificationCode(user, verificationCode)) {
        return false;
      }
    }

    user.verified = true;
    user.modifiedBy = userId;
    delete user.mobileNumber; // need to remove mobile number to prevent update method setting verified = false
    await this.update(user);

    /* On a fresh account, unsubscribe should not find any previous subscriptions, so this will subscribe user to General List.
    For existing uers, old subscriptions will be unsubscribed and resubscribed */
    if (user.isSubscribedToMarketing) {
      await this.messageService.resubscribeToTextMessageMarketing(
        userId,
        mobileNumber,
      );
    }
    return user.verified;
  }

  private async setOtherAddressesNotPrimary(
    userId: number,
  ): Promise<UpdateResult> {
    return this.userAddressRepository.update({ userId }, { isPrimary: false });
  }

  /** Mutate the user entity with AWS ARN subscription. */
  public async subscribeUserToMarketing(
    user: User,
    organizationId?: number,
  ): Promise<User> {
    try {
      if (user && user.mobileNumber) {
        await this.messageService.subscribeToTextMessageMarketing(
          user.id,
          user.mobileNumber,
          organizationId,
        );
        user.isSubscribedToMarketing = true;
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  /** Update user entity after unsubscribing AWS ARN subscription. */
  public async unsubscribeUserFromMarketing(user: User): Promise<User> {
    const { id } = user;
    try {
      await this.messageService.unsubscribeToTextMessageMarketing(id);
      return this.update({
        id,
        isSubscribedToMarketing: false,
      } as User);
    } catch (error) {
      throw error;
    }
  }

  /** Checks if user is currently being activated or deactivated.
   * If the 'request' user.deleted value differs from the 'db' user.deleted value.
   */
  private async isUserStatusBeingToggled(requestUser: User) {
    if (requestUser.hasOwnProperty('deleted')) {
      const oldUser = (await this.findById(requestUser.id)) as User;
      return requestUser.deleted !== oldUser.deleted;
    }
    return false;
  }

  private async toggleUserSubscriptions(userId: number) {
    // Need to retrieve full GD User object
    const updatedUser = (await this.findById(userId)) as User;
    try {
      // Avoid guessing the truthy/falsey 'deleted' value, should check strict boolean values only
      // Otherwise, do nothing to avoid unnecessary AWS calls.
      if (updatedUser.hasOwnProperty('deleted')) {
        if (updatedUser.deleted === true) {
          await this.messageService.unsubscribeToTextMessageMarketing(
            updatedUser.id,
          );
        } else if (updatedUser.isSubscribedToMarketing) {
          await this.messageService.resubscribeToTextMessageMarketing(
            updatedUser.id,
            updatedUser.mobileNumber,
          );
        }
      }
    } catch (error) {
      // Silence subscribe / unsubscribe exceptions not related to update().
      return;
    }
  }

  public async loginWithToken(token: string): Promise<JwtToken> {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role')
        .innerJoinAndSelect('user.signInLinks', 'signInLink')
        .andWhere('signInLink.token = :token', { token })
        .getOne();

      const signInLink = user && _.head(user.signInLinks);
      GDExpectedException.try(
        SignInLinkExceptions.signInLinkInvalid,
        signInLink,
      );

      const jwtToken = this.authService.createToken(user.id, user.email);
      delete user.signInLinks;
      jwtToken.user = user;
      return jwtToken;
    } catch (error) {
      throw error;
    }
  }

  public async hasExternalAccount(email: string): Promise<boolean> {
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoin(FreewayUser, 'freewayUser', 'user.email = freewayUser.email')
        .leftJoin(
          BiotrackUser,
          'biotrackUser',
          'user.email = biotrackUser.email',
        )
        .andWhere('freewayUser.email = :email OR biotrackUser.email = :email', {
          email,
        });

      return (await query.getCount()) > 0;
    } catch (error) {
      throw error;
    }
  }

  public formatPhoneNumber(phone: string): string {
    const pn: PhoneNumber = new PhoneNumber(
      phone,
      PHONENUMBER_CONFIG.regionCode,
    );
    const internationalPhoneNumber: string = pn.getNumber('international');
    if (!internationalPhoneNumber) {
      return;
    }
    return '' + internationalPhoneNumber.replace(/\s+/g, '-');
  }

  public isValidPhoneNumber(phone: string): boolean {
    const formattedPhoneNumber = this.formatPhoneNumber(phone);
    if (!formattedPhoneNumber) {
      return false;
    }
    // final mobile number should match E.164 format for compatibility with AWS SNS
    return isMobilePhone(this.formatPhoneNumber(phone), [
      PHONENUMBER_CONFIG.locale,
    ]);
  }

  /**
   * This will get all the associated organization of a user (by email).
   * This will search through freeway_user and biotrack_user table, retrieving
   * the org_id and pos_org_id, then searching them in the organization table.
   */
  public async findUserOrgsByEmail(email: string): Promise<Organization[]> {
    if (!email) {
      return;
    }

    return this.organizationService.getFreewayBiotrackUserOrganizations(email);
  }
}
