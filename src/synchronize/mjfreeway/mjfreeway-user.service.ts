import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';
import { EntityManager, Repository } from 'typeorm';
import { isNumber } from 'util';

import {HttpService, Injectable, LoggerService} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { Environments } from '../../app.service';
import { FreewayUserAddress } from '../../entities/freeway-user-address.entity';
import { FreewayUserIdentification } from '../../entities/freeway-user-identification.entity';
import {
  FreewayUserLog,
  FreewayUserLogStatus,
} from '../../entities/freeway-user-log.entity';
import { FreewayUserPhone } from '../../entities/freeway-user-phone.entity';
import { FreewayUser } from '../../entities/freeway-user.entity';
import { Location } from '../../entities/location.entity';
import { Organization } from '../../entities/organization.entity';
import { Role } from '../../entities/role.entity';
import { UserIdentification } from '../../entities/user-identification.entity';
import { UserRole } from '../../entities/user-role.entity';
import { User } from '../../entities/user.entity';
import { IdentificationParams } from '../../order/dto/order-search.dto';
import { RoleEnum } from '../../roles/roles.enum';
import { RolesService } from '../../roles/roles.service';
import { SignInLinkService } from '../../sign-in-link/sign-in-link.service';
import { UserRoleService } from '../../user-role/user-role.service';
import { UserIdentificationType } from '../../user/freeway-user/freeway-user.dto';
import { REGEX_TLD_EMAIL, UserService } from '../../user/user.service';
import { PosInfo } from './mjfreeway-order.service';
import { httpConfig } from '../../common/http.config';
import {AxiosRequestConfig} from 'axios';
import {GreenDirectLogger} from '../../greendirect-logger';

const BASE_URL = 'https://partner-gateway.mjplatform.com/v1';

export interface PromiseRegistration {
  promise: {
    resolve: (value?) => void;
    reject: (reason?) => void;
  };
  lastRequest: Date;
}

export interface BwellUser {
  freewayId: number;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  mobileNumber: string;
}

export class MjfreewayUserLog {
  private freewayUserUpdateRegistrations = [];
  private freewayUserLog: FreewayUserLog[];

  constructor(private readonly entityManager: EntityManager) {
    this.freewayUserUpdateRegistrations = [];
    this.freewayUserLog = [];
  }

  registerFreewayUserUpdate(promiseRegistration: PromiseRegistration) {
    this.freewayUserUpdateRegistrations.push(promiseRegistration);
  }

  notifyFreewayUserRegistrations() {
    for (const promiseRegistration of this.freewayUserUpdateRegistrations) {
      const freewayUserLog = [];
      for (const userLog of this.freewayUserLog) {
        if (userLog.modified > promiseRegistration.lastRequest) {
          freewayUserLog.push(userLog);
        }
      }
      if (freewayUserLog.length > 0) {
        promiseRegistration.promise.resolve(freewayUserLog);
        const index = this.freewayUserUpdateRegistrations.indexOf(
          promiseRegistration,
        );
        this.freewayUserUpdateRegistrations.splice(index, 1);
      }
    }
  }

  pushFreewayUserLog(updatedFreewayUserLog: FreewayUserLog) {
    const index = _.findIndex(this.freewayUserLog, {
      id: updatedFreewayUserLog.id,
    });
    if (index === -1) {
      this.freewayUserLog.push(updatedFreewayUserLog);
    } else {
      this.freewayUserLog[index] = updatedFreewayUserLog;
    }
    this.notifyFreewayUserRegistrations();
  }

  async createFreewayUserLog(
    userId: number,
    organization: Organization,
  ): Promise<FreewayUserLog> {
    let freewayUserLog = new FreewayUserLog();
    freewayUserLog.organization = new Organization();
    freewayUserLog.organization.id = organization.id;
    freewayUserLog.user = new User();
    freewayUserLog.user.id = userId;
    freewayUserLog.status = FreewayUserLogStatus.started;
    freewayUserLog.message = `Synchronizing organization '${organization.name}'; id: ${organization.id}`;
    freewayUserLog = await this.entityManager.save(
      FreewayUserLog,
      freewayUserLog,
    );
    this.pushFreewayUserLog(freewayUserLog);
    return freewayUserLog;
  }

  async updateFreewayUserLog(
    userLog: FreewayUserLog,
    status,
    message,
  ): Promise<any> {
    userLog.status = status;
    userLog.message = message;
    userLog = await this.entityManager.save(userLog);
    this.pushFreewayUserLog(userLog);
    return userLog;
  }

  async updateUserLogCount(userLog: FreewayUserLog, count: number) {
    userLog.userCount = count;
    userLog = await this.entityManager.save(userLog);
    this.pushFreewayUserLog(userLog);
  }
}

@Injectable()
export class MjfreewayUserService {
  private freewayUserLogs: MjfreewayUserLog;
  private logger: LoggerService = new GreenDirectLogger('MjfreewayUserService');

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly userService: UserService,
    private readonly rolesService: RolesService,
    private readonly userRoleService: UserRoleService,
    private readonly signInLinkService: SignInLinkService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @InjectRepository(FreewayUserIdentification)
    private readonly freewayUserIdentificationRepository: Repository<FreewayUserIdentification>,
  ) {
    this.freewayUserLogs = new MjfreewayUserLog(entityManager);
  }

  async synchronizeUsers() {
    this.logger.log('synchronizeUsers');
    const organizations = await this.getOrganizations();
    for (const organization of organizations) {
      this.logger.log(`synchronizeUsers looping on org ${organization.id}`);
      const userLog = await this.freewayUserLogs.createFreewayUserLog(
        1,
        organization,
      );
      if (!organization.posConfig || !organization.posConfig.apiKey) {
        await this.freewayUserLogs.updateFreewayUserLog(
          userLog,
          FreewayUserLogStatus.failed,
          'No POS configuration specified',
        );
        continue;
      }
      await this.synchronizeFreewayUsers(userLog, organization);
    }
  }

  async synchronizeFreewayUsers(
    userLog: FreewayUserLog,
    organization: Organization,
  ) {
    let userCount = 0;
    let page = 1;
    let freewayUsers;
    const startTime = new Date().getTime();
    do {
      const importFreewayUsers = [];
      const importFreewayAddresses = [];
      const importFreewayIdentifications = [];
      const importFreewayPhoneNumbers = [];
      freewayUsers = await this.getFreewayUsers(organization, page);
      await this.freewayUserLogs.updateFreewayUserLog(
        userLog,
        FreewayUserLogStatus.updatingFreewayUsers,
        `Processing update with ${freewayUsers.total} users`,
      );
      freewayUsers.data.forEach(async fwUser => {
        importFreewayUsers.push(
          this.mapFreewayUserForImport(fwUser, organization.posId),
        );
        fwUser.addresses.forEach(address => {
          importFreewayAddresses.push(this.mapFreewayAddressForImport(address));
        });
        fwUser.ids.forEach(id => {
          importFreewayIdentifications.push(
            this.mapFreewayIdentificationForImport(id),
          );
        });
        fwUser.phone_numbers.forEach(phoneNumber => {
          importFreewayPhoneNumbers.push(
            this.mapFreewayPhoneNumberForImport(phoneNumber),
          );
        });
        userCount++;
      });
      // only import if the import array is not empty
      if (importFreewayUsers.length > 0) {
        await this.importFreewayUsers(importFreewayUsers);
      }
      if (importFreewayAddresses.length > 0) {
        await this.importFreewayAddresses(importFreewayAddresses);
      }
      if (importFreewayIdentifications.length > 0) {
        await this.importFreewayIdentifications(importFreewayIdentifications);
      }
      if (importFreewayPhoneNumbers.length > 0) {
        await this.importFreewayPhoneNumbers(importFreewayPhoneNumbers);
      }
      await this.freewayUserLogs.updateUserLogCount(userLog, userCount);
      page++;
    } while (freewayUsers.current_page < freewayUsers.last_page);
    const timeLapse = (new Date().getTime() - startTime) / 1000;
    return this.freewayUserLogs.updateFreewayUserLog(
      userLog,
      FreewayUserLogStatus.completed,
      `Completed processing in ${timeLapse.toFixed(2)}sec`,
    );
  }

  async getFreewayUsers(
    organization: Organization,
    page: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = `${BASE_URL}/consumers?page=${page}&per_page=1000`;
      this.httpService.get(apiPath, this.getHttpConfig(organization)).subscribe(
        async response => {
          resolve(response.data);
        },
        async error => {
          reject(error);
        },
      );
    });
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.entityManager
      .createQueryBuilder(Organization, 'organization')
      .select()
      .where('organization.deleted = false')
      .andWhere('organization.pos = :pos', { pos: 'mjfreeway' })
      .getMany();
  }

  getHttpConfig(organization: Organization): AxiosRequestConfig {
    const posConfig = organization.posConfig;
    return {
      baseURL: BASE_URL,
      headers: {
        ...httpConfig.headers,
        'Content-Type': 'application/json',
        'x-mjf-api-key': posConfig.apiKey,
        'x-mjf-organization-id': organization.posId,
        'x-mjf-user-id': posConfig.userId,
      },
    };
  }

  mapFreewayUserForImport(freewayUser: any, orgId: number): FreewayUser {
    const importUser = new FreewayUser();
    importUser.posId = freewayUser.id;
    importUser.orgId = orgId;
    importUser.firstName = freewayUser.first_name;
    importUser.middleName = freewayUser.middle_name;
    importUser.lastName = freewayUser.last_name;
    if (freewayUser.email_address) {
      importUser.email = freewayUser.email_address.toLowerCase();
    }
    importUser.gender = freewayUser.gender;
    importUser.birthday = freewayUser.birth_date;
    importUser.active = !!freewayUser.active;
    importUser.primaryFacility = freewayUser.primary_facility_id;
    importUser.physicianName = freewayUser.physician_name;
    importUser.physicianLicense = freewayUser.physician_license;
    importUser.physicianAddress = freewayUser.physician_address;
    importUser.diagnosis = freewayUser.diagnosis;
    importUser.type = freewayUser.type;
    importUser.preferredContact = freewayUser.preferred_contact;
    importUser.taxExempt = !!freewayUser.tax_exempt;
    importUser.orderCountWeek = freewayUser.order_count_week;
    importUser.orderCountMonth = freewayUser.order_count_month;
    importUser.orderCountNinety = freewayUser.order_count_90_days;
    importUser.totalPoints = freewayUser.total_points;
    importUser.totalOrders = freewayUser.total_orders;
    importUser.totalSpent = freewayUser.total_spent;
    importUser.favoriteFlower = freewayUser.favorite_flower_item_name;
    importUser.favoriteEdible = freewayUser.favorite_edible_item_name;
    importUser.favoriteConcentrate = freewayUser.favorite_concentrate_item_name;
    importUser.favoriteTopical = freewayUser.favorite_topical_item_name;
    importUser.favoriteFlowerId = freewayUser.favorite_flower_item_master_id;
    importUser.favoriteEdibleId = freewayUser.favorite_edible_item_master_id;
    importUser.favoriteConcentrateId =
      freewayUser.favorite_concentrate_item_master_id;
    importUser.favoriteTopicalId = freewayUser.favorite_topical_item_master_id;
    importUser.created = freewayUser.created_at;
    importUser.modified = freewayUser.updated_at;

    return importUser;
  }

  mapFreewayAddressForImport(freewayAddress: any): FreewayUserAddress {
    const importAddress = new FreewayUserAddress();
    importAddress.posId = freewayAddress.id;
    importAddress.freewayUser = freewayAddress.consumer_id;
    importAddress.orgId = freewayAddress.organization_id;
    importAddress.streetAddress1 = freewayAddress.street_address_1;
    importAddress.streetAddress2 = freewayAddress.street_address_2;
    importAddress.city = freewayAddress.city;
    importAddress.providenceCode = freewayAddress.province_code;
    importAddress.postalCode = freewayAddress.postal_code;
    importAddress.countryCode = freewayAddress.country_code;
    importAddress.primary = !!freewayAddress.primary;
    importAddress.active = !!freewayAddress.active;
    importAddress.created = freewayAddress.created_at;
    importAddress.modified = freewayAddress.updated_at;
    importAddress.deleted = freewayAddress.deleted_at;

    return importAddress;
  }

  mapFreewayIdentificationForImport(freewayID: any): FreewayUserIdentification {
    const importID = new FreewayUserIdentification();
    importID.posId = freewayID.id;
    importID.freewayUser = freewayID.consumer_id;
    importID.orgId = freewayID.organization_id;
    importID.type = freewayID.type;
    importID.state = freewayID.state;
    importID.idNumber = freewayID.identification_number;
    importID.active = !!freewayID.active;
    importID.fileId = freewayID.file_id;
    importID.isRenewal = !!freewayID.is_renewal;
    importID.effective = freewayID.effective_at;
    importID.expires = freewayID.expired_at;
    importID.created = freewayID.created_at;
    importID.modified = freewayID.updated_at;
    importID.deleted = freewayID.deleted_at;

    return importID;
  }

  mapFreewayPhoneNumberForImport(freewayPhone: any): FreewayUserPhone {
    const importNumber = new FreewayUserPhone();
    importNumber.posId = freewayPhone.id;
    importNumber.freewayUser = freewayPhone.consumer_id;
    importNumber.orgId = freewayPhone.organization_id;
    importNumber.type = freewayPhone.type;
    importNumber.number = freewayPhone.number;
    importNumber.active = !!freewayPhone.active;
    importNumber.sms = !!freewayPhone.sms;
    importNumber.created = freewayPhone.created_at;
    importNumber.modified = freewayPhone.updated_at;
    importNumber.deleted = freewayPhone.deleted_at;

    return importNumber;
  }

  async importFreewayUsers(freewayUsers: FreewayUser[]) {
    await this.entityManager
      .createQueryBuilder(FreewayUser, 'freeway_user')
      .insert()
      .values(freewayUsers)
      .onConflict(
        `("pos_id") DO UPDATE SET
      "org_id" = excluded."org_id",
      "first_name" = excluded."first_name",
      "middle_name" = excluded."middle_name",
      "last_name" = excluded."last_name",
      "email" = excluded."email",
      "gender" = excluded."gender",
      "birthday" = excluded."birthday",
      "active" = excluded."active",
      "primary_facility_id" = excluded."primary_facility_id",
      "physician_name" = excluded."physician_name",
      "physician_license" = excluded."physician_license",
      "physician_address" = excluded."physician_address",
      "diagnosis" = excluded."diagnosis",
      "type" = excluded."type",
      "preferred_contact" = excluded."preferred_contact",
      "order_count_week" = excluded."order_count_week",
      "order_count_month" = excluded."order_count_month",
      "order_count_90_days" = excluded."order_count_90_days",
      "total_points" = excluded."total_points",
      "total_orders" = excluded."total_orders",
      "total_spent" = excluded."total_spent",
      "favorite_flower_item_name" = excluded."favorite_flower_item_name",
      "favorite_edible_item_name" = excluded."favorite_edible_item_name",
      "favorite_concentrate_item_name" = excluded."favorite_concentrate_item_name",
      "favorite_topical_item_name" = excluded."favorite_topical_item_name",
      "favorite_flower_item_id" = excluded."favorite_flower_item_id",
      "favorite_edible_item_id" = excluded."favorite_edible_item_id",
      "favorite_concentrate_item_id" = excluded."favorite_concentrate_item_id",
      "favorite_topical_item_id" = excluded."favorite_topical_item_id",
      "created" = excluded."created",
      "modified" = excluded."modified"`,
      )
      .execute();
  }

  async importFreewayAddresses(freewayAddresses: FreewayUserAddress[]) {
    await this.entityManager
      .createQueryBuilder(FreewayUserAddress, 'freeway_user_address')
      .insert()
      .values(freewayAddresses)
      .onConflict(
        `("pos_id") DO UPDATE SET
      "freeway_user_id" = excluded."freeway_user_id",
      "org_id" = excluded."org_id",
      "street_address_1" = excluded."street_address_1",
      "street_address_2" = excluded."street_address_2",
      "city" = excluded."city",
      "providence_code" = excluded."providence_code",
      "postal_code" = excluded."postal_code",
      "country_code" = excluded."country_code",
      "primary" = excluded."primary",
      "active" = excluded."active",
      "created" = excluded."created",
      "modified" = excluded."modified",
      "deleted" = excluded."deleted"`,
      )
      .execute();
  }

  async importFreewayIdentifications(freewayIDs: FreewayUserIdentification[]) {
    await this.entityManager
      .createQueryBuilder(
        FreewayUserIdentification,
        'freeway_user_identification',
      )
      .insert()
      .values(freewayIDs)
      .onConflict(
        `("pos_id") DO UPDATE SET
      "freeway_user_id" = excluded."freeway_user_id",
      "org_id" = excluded."org_id",
      "type" = excluded."type",
      "id_number" = excluded."id_number",
      "state" = excluded."state",
      "active" = excluded."active",
      "file_id" = excluded."file_id",
      "is_renewal" = excluded."is_renewal",
      "effective" = excluded."effective",
      "expires" = excluded."expires",
      "created" = excluded."created",
      "modified" = excluded."modified",
      "deleted" = excluded."deleted"`,
      )
      .execute();
  }

  async importFreewayPhoneNumbers(freewayPhoneNumbers: FreewayUserPhone[]) {
    await this.entityManager
      .createQueryBuilder(FreewayUserPhone, 'freeway_user_phone')
      .insert()
      .values(freewayPhoneNumbers)
      .onConflict(
        `("pos_id") DO UPDATE SET
      "freeway_user_id" = excluded."freeway_user_id",
      "org_id" = excluded."org_id",
      "type" = excluded."type",
      "number" = excluded."number",
      "active" = excluded."active",
      "sms" = excluded."sms",
      "created" = excluded."created",
      "modified" = excluded."modified",
      "deleted" = excluded."deleted"`,
      )
      .execute();
  }

  async importBwellUsers(bwellUsers: BwellUser[]) {
    for (let index = 674; index < bwellUsers.length; index++) {
      const bwellUser = bwellUsers[index];
      const existingUser = await this.entityManager.findOne(User, {
        where: { email: bwellUser.email },
      });
      if (existingUser) {
        // tslint:disable-next-line
        this.logger.log(`user ${bwellUser.email} already exists.`);
        continue;
      }
      const rounds = await this.configService.get('password.rounds');
      let newUser = new User();
      newUser.email = bwellUser.email;
      newUser.firstName = bwellUser.firstName;
      newUser.lastName = bwellUser.lastName;
      newUser.mobileNumber = bwellUser.mobileNumber;
      if (isNumber(bwellUser.freewayId)) {
        newUser.posId = bwellUser.freewayId;
      }
      newUser.verified = true;
      newUser.password = await bcrypt.hash(bwellUser.password, rounds);
      newUser = await this.entityManager.save(newUser);

      this.logger.log(
        `${index} of ${bwellUsers.length} created user id ${newUser.id} for ${newUser.email}`,
      );
      // if (index > 2) {
      //   return;
      // }
    }
  }

  async onBoardNewUsersToGD(): Promise<User[]> {
    try {
      const newlyAddedUsers = await this.createGDAccounts();
      await this.subscribeUsersToMarketing(newlyAddedUsers);
      if (process.env.NODE_ENV === Environments.PRODUCTION) {
        await this.signInLinkService.generateSignInLinks(newlyAddedUsers);
      }
      return newlyAddedUsers;
    } catch (error) {
      // send notification email?
      throw error;
    }
  }

  /**
   * Creates new GD accounts to mjFreeway users that has no GD accounts yet.
   * Determined if the mjFreeway user's email does not exist on GD user table.
   */
  async createGDAccounts(): Promise<User[]> {
    try {
      this.logger.log('createGDAccounts');

      const freewayUsers: FreewayUser[] = await this.getUsersNotYetInGD();
      const newlyAddedUsersPromises: Promise<User>[] = freewayUsers
        .filter((freewayUser: FreewayUser) => {
          // Don't create accounts for users with invalid email and phone number.
          const isEmailValid =
            freewayUser &&
            freewayUser.email &&
            REGEX_TLD_EMAIL.test(freewayUser.email);
          const isPhoneNumberValid =
            !_.isEmpty(freewayUser.phoneNumbers) &&
            !!this.getFirstValidFreewayPhoneNumber(freewayUser.phoneNumbers);
          return isEmailValid && isPhoneNumberValid;
        })
        .map((freewayUser: FreewayUser) =>
          this.userService.create({
            posId: freewayUser.posId,
            firstName: freewayUser.firstName,
            lastName: freewayUser.lastName,
            email: freewayUser.email,
            password: '',
            mobileNumber: this.userService.formatPhoneNumber(
              this.getFirstValidFreewayPhoneNumber(freewayUser.phoneNumbers)
                .number,
            ),
            verified: true,
          } as User),
        );

      const newlyAddedUsers: User[] = await Promise.all(
        newlyAddedUsersPromises,
      );

      // Assign new users to `patient` role.
      const assignToRolePromises = newlyAddedUsers.map((user: User) =>
        this.assignToRole(user.id, RoleEnum.Patient),
      );
      await Promise.all(assignToRolePromises);
      return newlyAddedUsers;
    } catch (error) {
      throw error;
    }
  }

  async assignToRole(userId: number, roleEnum: RoleEnum): Promise<UserRole> {
    try {
      const [user, role] = await Promise.all([
        this.userService.findById(userId),
        this.rolesService.findByName(roleEnum),
      ]);
      const userRole: UserRole = { user: user as User, role: role as Role };

      return this.userRoleService.upsert(userRole);
    } catch (error) {
      throw error;
    }
  }

  async getUsersNotYetInGD(): Promise<FreewayUser[]> {
    try {
      const tableName = 'freeway_user';
      const query = this.entityManager
        .createQueryBuilder(FreewayUser, tableName)
        .select()
        .where(qb => {
          // gets only one (with the min posId) mjfreeway user when there are several rows with the same email.
          const subQuery = qb
            .subQuery()
            .select(`MIN(${tableName}.posId)`)
            .from(FreewayUser, tableName)
            .groupBy(`${tableName}.email`)
            .getQuery();
          return `${tableName}.posId IN ${subQuery}`;
        })
        .andWhere(`${tableName}.email IS NOT NULL`)
        .andWhere(`${tableName}.active = true`)
        .andWhere(qb => {
          // check if the mjFreeway user's email does not exist in GD users.
          const subQuery = qb
            .subQuery()
            .select()
            .from(User, 'user')
            .where(`user.email ILIKE ${tableName}.email`)
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .leftJoinAndSelect(`${tableName}.phoneNumbers`, 'phoneNumber')
        .orderBy(`${tableName}.posId`, 'ASC');
      return query.getMany();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets the first valid FreewayUserPhone number.
   */
  private getFirstValidFreewayPhoneNumber(
    freewayUserPhones: FreewayUserPhone[],
  ): FreewayUserPhone {
    try {
      if (_.isEmpty(freewayUserPhones)) {
        return;
      }
      return freewayUserPhones.find(
        (freewayUserPhone: FreewayUserPhone) =>
          freewayUserPhone.number &&
          this.userService.isValidPhoneNumber(freewayUserPhone.number),
      );
    } catch (error) {
      throw error;
    }
  }

  async subscribeUsersToMarketing(users: User[]): Promise<void> {
    try {
      this.logger.log('subscribeUsersToMarketing');

      if (_.isEmpty(users)) {
        return;
      }

      const subscribedUsersPromises: Promise<User>[] = [];
      for (const user of users) {
        const organizations = await this.userService.findUserOrgsByEmail(
          user.email,
        );

        // subscribe to General List for SMS Blast (do not provide organizationId)
        subscribedUsersPromises.push(
          this.userService.subscribeUserToMarketing(user),
        );
        for (const organization of organizations) {
          // subscribe to associated organization  for SMS Blast
          subscribedUsersPromises.push(
            this.userService.subscribeUserToMarketing(user, organization.id),
          );
        }
      }
      await Promise.all(subscribedUsersPromises);
    } catch (error) {
      throw error;
    }
  }

  // TODO Why not just take a phone number as an argument? -lbradley
  async findConsumerByPhone(user: User, orgId: number): Promise<FreewayUser> {
    const phoneNumber = user.mobileNumber;
    const result = await this.entityManager.query(
      `
      SELECT freeway_user_id FROM freeway_user_phone
      WHERE right(regexp_replace("number", '\\D','','g'), 10) =
      right(regexp_replace($1, '\\D','','g'), 10)
      AND org_id = $2`,
      [phoneNumber, orgId],
    );
    if (result.length < 1) {
      return;
    }
    return this.findConsumerByPosId(result[0].freeway_user_id);
  }

  async findConsumerByPosId(posId: number): Promise<FreewayUser> {
    return this.entityManager
      .createQueryBuilder(FreewayUser, 'freeway_user')
      .select()
      .where('pos_id = :posId', { posId })
      .getOne();
  }

  /**
   * Find FreewayUser by FreewayUserIdentification.posId
   */
  async findConsumerByIdentification(posId: number): Promise<FreewayUser> {
    const freewayId = await this.freewayUserIdentificationRepository
      .createQueryBuilder('userIdentification')
      .innerJoinAndSelect(
        'userIdentification.freewayUser',
        'freewayUser',
        'freewayUser.active = true',
      )
      .where('userIdentification.posId = :posId', { posId })
      .getOne();
    return freewayId.freewayUser;
  }

  async getIdentification(
    orgId: number,
    patientNumber?: string,
    mobileNumber?: string,
    email?: string,
  ): Promise<FreewayUserIdentification> {
    try {
      const query = this.freewayUserIdentificationRepository
        .createQueryBuilder('userIdentification')
        .innerJoinAndSelect(
          'userIdentification.freewayUser',
          'freewayUser',
          'freewayUser.active = true',
        )
        .where('userIdentification.type = :type', {
          type: UserIdentificationType.MED,
        })
        .andWhere('userIdentification.active IS NOT NULL')
        .andWhere('userIdentification.orgId = :orgId', { orgId });
      let whereClause = '';
      if (patientNumber) {
        whereClause =
          /** Remove non digit characters to check only numeric values */
          `trim(leading '0' from right(regexp_replace(userIdentification.idNumber, '\\D','','g'), 8)) =
            trim(leading '0' from right(regexp_replace(:patientNumber, '\\D','','g'), 8))`;
      }
      if (mobileNumber) {
        query.leftJoin(
          'freewayUser.phoneNumbers',
          'phoneNumbers',
          'phoneNumbers.active = true',
        );
        /** Remove non digit characters to check only numeric values */
        whereClause += `${whereClause.length > 0 ? ' OR ' : ''}
          right(regexp_replace(phoneNumbers.number, '\\D','','g'),10) =
          right(regexp_replace(:mobileNumber, '\\D','','g'), 10)`;
      }
      if (email) {
        whereClause += `${
          whereClause.length > 0 ? ' OR ' : ''
        } freewayUser.email ILIKE :email`;
      }
      if (!whereClause) {
        return null;
      }
      return query
        .andWhere(whereClause, { patientNumber, mobileNumber, email })
        .getOne();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is a medical user and create a UserIdentification
   * @param posInfo
   * @param email
   */
  public async matchUserIdentification(
    posInfo: PosInfo,
    identificationParams: IdentificationParams,
  ): Promise<any> {
    const { patientNumber, mobileNumber, email } = identificationParams;
    const mjIdentification = await this.getIdentification(
      posInfo.organizationPosId,
      patientNumber,
      mobileNumber,
      email,
    );
    if (!mjIdentification) {
      return null;
    }
    const userIdentification = new UserIdentification();
    userIdentification.user = new User();
    userIdentification.user.id = posInfo.userId;
    userIdentification.location = new Location();
    userIdentification.location.id = posInfo.locationId;
    userIdentification.email = mjIdentification.freewayUser.email;
    userIdentification.posId = mjIdentification.posId;
    userIdentification.type = mjIdentification.type;
    userIdentification.number = mjIdentification.idNumber;
    userIdentification.state = mjIdentification.state;
    userIdentification.isActive = !!mjIdentification.active;
    userIdentification.expires = mjIdentification.expires;
    userIdentification.createdBy = posInfo.userId;
    userIdentification.modifiedBy = posInfo.userId;
    return userIdentification;
  }
}
