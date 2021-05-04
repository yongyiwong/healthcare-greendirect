import * as _ from 'lodash';
import * as serializeError from 'serialize-error';
import { EntityManager, Repository } from 'typeorm';

import {HttpService, Injectable, LoggerService} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { Environments } from '../../app.service';
import {
  BiotrackUserLog,
  BiotrackUserLogStatus,
} from '../../entities/biotrack-user-log.entity';
import { BiotrackUser } from '../../entities/biotrack-user.entity';
import { Location } from '../../entities/location.entity';
import { Organization } from '../../entities/organization.entity';
import { Role } from '../../entities/role.entity';
import { UserIdentification } from '../../entities/user-identification.entity';
import { UserRole } from '../../entities/user-role.entity';
import { User } from '../../entities/user.entity';
import { NotificationService } from '../../notification/notification.service';
import { IdentificationParams } from '../../order/dto/order-search.dto';
import { RoleEnum } from '../../roles/roles.enum';
import { RolesService } from '../../roles/roles.service';
import { SignInLinkService } from '../../sign-in-link/sign-in-link.service';
import { UserRoleService } from '../../user-role/user-role.service';
import { REGEX_TLD_EMAIL, UserService } from '../../user/user.service';
import { PosInfo } from '../mjfreeway/mjfreeway-order.service';
import { httpConfig } from '../../common/http.config';
import {GreenDirectLogger} from '../../greendirect-logger';
import { UserIdentificationService } from '../../user-identification/user.identification.service';

@Injectable()
export class BiotrackUserService {
  private logger: LoggerService = new GreenDirectLogger('BiotrackUserService');

  constructor(
    private readonly httpService: HttpService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly userIdentificationService: UserIdentificationService,
    private readonly rolesService: RolesService,
    private readonly userRoleService: UserRoleService,
    private readonly signInLinkService: SignInLinkService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @InjectRepository(BiotrackUser)
    private readonly biotrackUserRepository: Repository<BiotrackUser>,
  ) {
  }

  async sendErrorNotificationEmail(subject: string, error: Error) {
    const configService = new ConfigService();
    await this.notificationService.sendEmail({
      from: configService.get('email.from'),
      to: configService.get('email.techSupport'),
      subject,
      message:
        'biotrack user sync error:\n' +
        JSON.stringify(serializeError(error), null, 2),
    });
  }

  async synchronizeUsers() {
    this.logger.log('synchronizeBiotrackUsers');

    const organizations = await this.getOrganizations();
    for (const organization of organizations) {
      const userLog = await this.createBiotrackUserLog(1, organization);
      if (!organization.posConfig || !organization.posConfig.url) {
        await this.updateBiotrackUserLog(
          userLog,
          BiotrackUserLogStatus.failed,
          'No biotrack endpoint url specified',
        );
        continue;
      }
      try {
        await this.synchronizeBiotrackUsers(userLog, organization);
      } catch (error) {
        this.sendErrorNotificationEmail(
          `GreenDirect: ${organization.name} sync error`,
          error,
        );
      }
    }
  }

  async synchronizeBiotrackUsers(
    userLog: BiotrackUserLog,
    organization: Organization,
  ) {
    let userCount = 0;
    let page = 0;
    let biotrackUsers;
    const startTime = new Date().getTime();
    do {
      const importBiotrackUsers = [];
      biotrackUsers = await this.getBiotrackUsers(organization, page);
      await this.updateBiotrackUserLog(
        userLog,
        BiotrackUserLogStatus.updatingFreewayUsers,
        `Processing update with ${biotrackUsers.total} users`,
      );
      biotrackUsers.data.forEach(async btUser => {
        importBiotrackUsers.push(
          this.mapBiotrackUserForImport(btUser, organization.posId),
        );
        userCount++;
      });
      await this.importBiotrackUsers(importBiotrackUsers);
      await this.updateUserLogCount(userLog, userCount);
      page++;
    } while (biotrackUsers.current_page < biotrackUsers.last_page);
    const timeLapse = (new Date().getTime() - startTime) / 1000;
    return this.updateBiotrackUserLog(
      userLog,
      BiotrackUserLogStatus.completed,
      `Completed processing in ${timeLapse.toFixed(2)}sec`,
    );
  }

  async getBiotrackUsers(
    organization: Organization,
    page: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = `${organization.posConfig.url}/customers?page=${page}`;
      this.httpService
        .get(apiPath, this.getHttpConfig(organization.posConfig))
        .subscribe(
          async response => {
            resolve(response.data);
          },
          async error => {
            reject(error);
          },
        );
    });
  }

  /**
   * If the BioTrackUser exists, returns null.  Otherwise, creates a new BiotrackUser
   * with only a userId, and saves it.  Then, populates and returns without saving a UserIdentification.
   * @param posInfo
   * @param identificationParams
   */
  async matchUserIdentification(
    posInfo: PosInfo,
    identificationParams: IdentificationParams,
  ): Promise<UserIdentification> {
    const { patientNumber, mobileNumber, email } = identificationParams;
    const biotrackUser = await this.findBiotrackUser(
      posInfo.organizationPosId,
      patientNumber,
      mobileNumber,
      email,
    );
    if (!biotrackUser) {
      return null;
    }
    const userIdentification = new UserIdentification();
    userIdentification.user = new User();
    userIdentification.user.id = posInfo.userId;
    userIdentification.location = new Location();
    userIdentification.location.id = posInfo.locationId;
    userIdentification.email = biotrackUser.email;
    userIdentification.number = biotrackUser.medicalNumber;
    userIdentification.state = biotrackUser.state;
    userIdentification.isActive = !biotrackUser.isDeleted;
    userIdentification.expires = biotrackUser.medicalExpireDate;
    userIdentification.type = 'med';
    userIdentification.createdBy = posInfo.userId;
    userIdentification.modifiedBy = posInfo.userId;
    return userIdentification;
  }

  async findBiotrackUser(
    orgId: number,
    patientNumber?: string,
    mobileNumber?: string,
    email?: string,
  ): Promise<BiotrackUser> {
    try {
      const query = this.entityManager
        .createQueryBuilder(BiotrackUser, 'biotrack_user')
        .select()
        .where(`is_deleted = false AND pos_org_id = :orgId`, { orgId });
      let whereClause = '';
      if (patientNumber) {
        whereClause =
          /** Remove non digit characters to check only numeric values */
          `trim(leading '0' from right(regexp_replace(medical_number, '\\D','','g'), 8)) =
          trim(leading '0' from right(regexp_replace(:patientNumber, '\\D','','g'), 8))`;
      }
      if (mobileNumber) {
        /** Remove non digit characters to check only numeric values */
        whereClause += `${whereClause.length > 0 ? ' OR ' : ''}
          right(regexp_replace(phone_number, '\\D','','g'), 10) =
          right(regexp_replace(:mobileNumber, '\\D','','g'), 10)`;
      }
      if (email) {
        whereClause += `${
          whereClause.length > 0 ? ' OR ' : ''
        } email ILIKE :email`;
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

  async findOrCreateBiotrackUser(posInfo: PosInfo): Promise<BiotrackUser> {
    this.logger.log(`findOrCreateBiotrackUser() ${JSON.stringify(posInfo)}`) ;
    const user = await this.findUser(posInfo.userId);
    this.logger.log(`findOrCreateBiotrackUser() found user ${JSON.stringify(user)}`) ;
    let biotrackUser = await this.findBiotrackUserByUserAndOrg(
      user,
      posInfo.organizationPosId,
    );
    this.logger.log(`findOrCreateBiotrackUser() found biotrack user ${JSON.stringify(biotrackUser)}`) ;
    if (!biotrackUser) {
      // If a local biotrackUser for that organization POS was not found
      const identificationParams = {
        patientNumber: user.patientNumber,
        mobileNumber: user.mobileNumber,
        email: user.email,
      };
      const identification = await this.matchUserIdentification(
        posInfo,
        identificationParams,
      );
      if (identification) {
        // TODO if the findCustomer() failed above... why would it work here? customer will still be undefined...
        biotrackUser = await this.findBiotrackUserByUserAndOrg(
          user,
          posInfo.organizationPosId,
        );

        this.logger.log(
          'Create identification from biotrack-user.findOrCreateCustomer ' +
            `posInfo ${JSON.stringify(posInfo)} identification ${JSON.stringify(
              identification,
          )}`,
        );
        await this.userIdentificationService.createIdentification(identification);
      } else {
        biotrackUser = new BiotrackUser();
        const remoteUser = await this.createCustomer(user, posInfo);
        biotrackUser.posId = remoteUser.posId;
        biotrackUser.posOrgId = posInfo.organizationPosId;
        biotrackUser.user = new User();
        biotrackUser.user.id = user.id;
        biotrackUser = await this.entityManager.save(biotrackUser);

        this.logger.log(
          'biotrack-user.findOrCreateBiotrackUser created remoteUser ' +
            `${JSON.stringify(
              remoteUser,
          )} and local biotrackUser ${JSON.stringify(biotrackUser)}`,
        );
      }
    }
    return biotrackUser;
  }

  async findUser(userId: number): Promise<any> {
    return this.userService.findById(userId);
  }

  async findBiotrackUserByUserAndOrg(
    user: User,
    orgId: number,
  ): Promise<BiotrackUser> {
    return this.entityManager
      .createQueryBuilder(BiotrackUser, 'biotrack_user')
      .where('pos_org_id = :orgId', { orgId })
      .andWhere('user_id = :userId', { userId: user.id })
      .getOne();
  }

  async createCustomer(user: User, posInfo: PosInfo): Promise<any> {
    let phoneNumber;
    if (user.mobileNumber) {
      phoneNumber = user.mobileNumber.replace('+1', '').replace(/-/g, '');
    }
    const customer = {
      userId: 'gd' + user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber,
    };

    this.logger.log(
      `biotrack-user.createCustomer() user ${JSON.stringify(
        user,
      )} posInfo ${JSON.stringify(posInfo)} ` +
      `customer ${JSON.stringify(customer)}`,
    );
    const apiPath = `${posInfo.posConfig.url}/customers`;
    return new Promise(async (resolve, reject) => {
      this.httpService
        .post(apiPath, customer, this.getHttpConfig(posInfo.posConfig))
        .subscribe(
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
      .andWhere('organization.pos = :pos', { pos: 'biotrack' })
      .getMany();
  }

  getHttpConfig(posConfig: any) {
    return {
      baseURL: posConfig.url,
      headers: {
        ...httpConfig.headers,
        'Content-Type': 'application/json',
      },
    };
  }

  mapBiotrackUserForImport(
    biotrackUser: BiotrackUser,
    orgId: number,
  ): BiotrackUser {
    biotrackUser.posOrgId = orgId;
    if (biotrackUser.email) {
      biotrackUser.email = biotrackUser.email.toLowerCase();
    }
    return biotrackUser;
  }

  async importBiotrackUsers(biotrackUsers: BiotrackUser[]) {
    await this.entityManager
      .createQueryBuilder(BiotrackUser, 'biotrack_user')
      .insert()
      .values(biotrackUsers)
      .onConflict(
        `("pos_id", "pos_org_id") DO UPDATE SET
      "first_name" = excluded."first_name",
      "middle_name" = excluded."middle_name",
      "last_name" = excluded."last_name",
      "email" = excluded."email",
      "birthday" = excluded."birthday",
      "medical_number" = excluded."medical_number",
      "medical_expire_date" = excluded."medical_expire_date",
      "license_number" = excluded."license_number",
      "license_expire_date" = excluded."license_expire_date",
      "address_line1" = excluded."address_line1",
      "address_line2" = excluded."address_line2",
      "city" = excluded."city",
      "state" = excluded."state",
      "postal_code" = excluded."postal_code",
      "phone_number" = excluded."phone_number",
      "is_sms_opt_in" = excluded."is_sms_opt_in",
      "total_points" = excluded."total_points",
      "total_orders" = excluded."total_orders",
      "total_spent" = excluded."total_spent",
      "is_deleted" = excluded."is_deleted",
      "created" = excluded."created",
      "modified" = excluded."modified"`,
      )
      .execute();
  }

  async createBiotrackUserLog(
    userId: number,
    organization: Organization,
  ): Promise<BiotrackUserLog> {
    let biotrackUserLog = new BiotrackUserLog();
    biotrackUserLog.organization = new Organization();
    biotrackUserLog.organization.id = organization.id;
    biotrackUserLog.user = new User();
    biotrackUserLog.user.id = userId;
    biotrackUserLog.status = BiotrackUserLogStatus.started;
    biotrackUserLog.message = `Synchronizing organization '${organization.name}'; id: ${organization.id}`;
    biotrackUserLog = await this.entityManager.save(
      BiotrackUserLog,
      biotrackUserLog,
    );
    return biotrackUserLog;
  }

  async updateBiotrackUserLog(
    userLog: BiotrackUserLog,
    status,
    message,
  ): Promise<any> {
    userLog.status = status;
    userLog.message = message;
    userLog = await this.entityManager.save(userLog);
    return userLog;
  }

  async updateUserLogCount(userLog: BiotrackUserLog, count: number) {
    userLog.userCount = count;
    userLog = await this.entityManager.save(userLog);
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
   * Creates new GD accounts to biotrack users that has no GD accounts yet.
   * Determined if the biotrack user's email does not already exist on GD user table.
   */
  async createGDAccounts(): Promise<User[]> {
    try {
      this.logger.log('createGDAccounts');
      const biotrackUsers: BiotrackUser[] = await this.getUsersNotYetInGD();

      const newlyAddedUsersPromises: Promise<User>[] = biotrackUsers
        .filter((btUser: BiotrackUser) => {
          // Don't create accounts for users with invalid email and mobile number.
          const isEmailValid =
            btUser && btUser.email && REGEX_TLD_EMAIL.test(btUser.email);

          const isMobileNumberValid =
            btUser &&
            btUser.phoneNumber &&
            this.userService.isValidPhoneNumber(btUser.phoneNumber);

          return isEmailValid && isMobileNumberValid;
        })
        .map((btUser: BiotrackUser) => {
          return this.userService.create({
            posId: null,
            firstName: btUser.firstName,
            lastName: btUser.lastName,
            email: btUser.email,
            password: '',
            mobileNumber: this.userService.formatPhoneNumber(
              btUser.phoneNumber,
            ),
            patientNumber: btUser.medicalNumber,
            verified: true,
          } as User);
        });

      const newlyAddedUsers: User[] = await Promise.all(
        newlyAddedUsersPromises,
      );

      // Assign new users to `patient` role.
      const assingToRolePromises = newlyAddedUsers.map((user: User) =>
        this.assignToRole(user.id, RoleEnum.Patient),
      );
      await Promise.all(assingToRolePromises);
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

  async getUsersNotYetInGD(): Promise<BiotrackUser[]> {
    try {
      const tableName = 'biotrack_user';
      const query = this.entityManager
        .createQueryBuilder(BiotrackUser, tableName)
        .select()
        .where(qb => {
          // gets only one (with the min id) biotrack user when there are several rows with the same email.
          const subQuery = qb
            .subQuery()
            .select(`MIN(${tableName}.id)`)
            .from(BiotrackUser, tableName)
            .groupBy(`${tableName}.email`)
            .getQuery();
          return `${tableName}.id IN ${subQuery}`;
        })
        .andWhere(`${tableName}.email IS NOT NULL`)
        .andWhere(`${tableName}.isDeleted = false`)
        .andWhere(qb => {
          // check if the biotrack user's email does not exist in GD users.
          const subQuery = qb
            .subQuery()
            .select()
            .from(User, 'user')
            .where(`user.email ILIKE ${tableName}.email`)
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .orderBy(`${tableName}.id`, 'ASC');
      return query.getMany();
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
}
