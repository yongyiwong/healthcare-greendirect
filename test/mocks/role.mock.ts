import { TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/user';
import { RolesService } from '../../src/roles/roles.service';
import { MOCK_USER_DATA, MOCK_ADMIN_EMAILS } from './user.mock';
import { RoleEnum } from '../../src/roles/roles.enum';
import { Role } from '../../src/entities/role.entity';
import { User } from '../../src/entities/user.entity';
import { LocationService } from '../../src/location';
import { UserLocationService } from '../../src/user-location/user-location.service';
import { UserRoleService } from '../../src/user-role/user-role.service';
import { UserRole } from '../../src/entities/user-role.entity';

export const MOCK_ROLES = {
  ADMINS: [MOCK_USER_DATA[0]],
  SITE_ADMINS: [MOCK_USER_DATA[2]],
  EMPLOYEES: [MOCK_USER_DATA[3], MOCK_USER_DATA[4]],
  PATIENTS: [
    MOCK_USER_DATA[1],
    MOCK_USER_DATA[5],
    MOCK_USER_DATA[6],
    MOCK_USER_DATA[7],
    MOCK_USER_DATA[8],
    MOCK_USER_DATA[11],
    MOCK_USER_DATA[12],
    MOCK_USER_DATA[13],
    MOCK_USER_DATA[14],
    MOCK_USER_DATA[15],
  ],
};

export class RoleMock {
  private rolesService: RolesService;
  private userService: UserService;
  private userRoleService: UserRoleService;
  private locationService: LocationService;
  private userLocationService: UserLocationService;

  constructor(private readonly module: TestingModule) {
    this.userService = module.get<UserService>(UserService);
    this.rolesService = module.get<RolesService>(RolesService);
    this.userRoleService = module.get<UserRoleService>(UserRoleService);
    this.locationService = module.get<LocationService>(LocationService);
    this.userLocationService = module.get<UserLocationService>(
      UserLocationService,
    );
  }

  async generate() {
    await this.setupAdmins();
    await this.setupSiteAdmins();
    await this.setupEmployees();
    await this.setupPatients();
  }

  async setupAdmins() {
    const role = (await this.rolesService.findByName(RoleEnum.Admin)) as Role;
    const adminPromises = MOCK_ROLES.ADMINS.map(async userInfo => {
      const user = (await this.userService.findByEmail(userInfo.email)) as User;
      const userRole = new UserRole();
      userRole.user = user;
      userRole.role = role;
      await this.userRoleService.create(userRole);
      return this.userLocationService.create(user.id, null, user.id);
    });
    return Promise.all(adminPromises);
  }

  async setupSiteAdmins() {
    const role = (await this.rolesService.findByName(
      RoleEnum.SiteAdmin,
    )) as Role;
    const siteAdminPromises = MOCK_ROLES.SITE_ADMINS.map(async userInfo => {
      const user = (await this.userService.findByEmail(userInfo.email)) as User;
      const locations = await this.locationService.findWithFilter({
        search: 'NextGen',
      });
      const location = locations[0][0];
      const userRole = new UserRole();
      userRole.user = user;
      userRole.role = role;
      await this.userRoleService.create(userRole);
      return this.userLocationService.create(user.id, location.id, user.id);
    });
    return Promise.all(siteAdminPromises);
  }

  async setupEmployees() {
    const role = (await this.rolesService.findByName(
      RoleEnum.Employee,
    )) as Role;
    const employeePromises = MOCK_ROLES.EMPLOYEES.map(
      async (userInfo, index) => {
        const user = (await this.userService.findByEmail(
          userInfo.email,
        )) as User;
        const userRole = new UserRole();
        userRole.user = user;
        userRole.role = role;
        await this.userRoleService.create(userRole);
        if (index === 0) {
          // Assign 3 locations to the first employee (Hillary Berry)
          const locations = await this.locationService.findWithFilter({
            limit: 3,
          });
          const userLocations = locations[0].map(location => {
            return this.userLocationService.create(
              user.id,
              location.id,
              user.id,
            );
          });
          return Promise.all(userLocations);
        } else {
          const locations = await this.locationService.findWithFilter({
            search: 'NextGen',
          });
          const location = locations[0][0];
          return this.userLocationService.create(user.id, location.id, user.id);
        }
      },
    );
    return Promise.all(employeePromises);
  }

  async setupPatients() {
    const role = (await this.rolesService.findByName(RoleEnum.Patient)) as Role;
    const patientPromises = MOCK_ROLES.PATIENTS.map(async userInfo => {
      const user = (await this.userService.findByEmail(userInfo.email)) as User;
      const userRole = new UserRole();
      userRole.user = user;
      userRole.role = role;
      await this.userRoleService.create(userRole);
      return this.userLocationService.create(user.id, null, user.id);
    });
    return Promise.all(patientPromises);
  }
}
