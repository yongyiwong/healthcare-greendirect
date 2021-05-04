import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { Location } from '../entities/location.entity';
import { User } from '../entities/user.entity';
import { UserService } from '../user/user.service';
import { UserLocationService } from './user-location.service';
import { SaveUserLocationsDto } from './dto/save-user-locations.dto';
import { LocationService } from '../location';
import { UserRoleService } from '../user-role/user-role.service';
import { UserLocation } from '../entities/user-location.entity';

describe('UserLocationService', () => {
  let userLocationService: UserLocationService;
  let userService: UserService;
  let userRoleService: UserRoleService;
  let locationService: LocationService;
  let admin: User;
  let siteAdmin: User;
  let location: Location;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    userLocationService = module.get<UserLocationService>(UserLocationService);
    userService = module.get<UserService>(UserService);
    userRoleService = module.get<UserRoleService>(UserRoleService);
    locationService = module.get<LocationService>(LocationService);
    admin = (await userService.findByEmail('admin_e2e@isbx.com')) as User;
    siteAdmin = (await userService.findByEmail(
      'gd_site_admin@isbx.com',
    )) as User;
    const [[selectedLocation]] = await locationService.findWithFilter({
      search: 'ISBX (e2e location test)',
    });
    location = selectedLocation as Location;
  });

  describe('Unit Tests', () => {
    it('should be defined', () => {
      expect(userLocationService).toBeDefined();
    });
  });

  describe('Happy Path Cases', () => {
    it(`should save user's assignments`, async () => {
      // make sure that admin is has not previous assignment
      await userLocationService.save(admin.id, admin.id, []);
      const previousUserLocations = await userLocationService.getAllByUserId(
        admin.id,
      );
      const assignments: SaveUserLocationsDto['assignments'] = [1, 2];
      await userLocationService.save(admin.id, admin.id, assignments);
      const newUserLocations = await userLocationService.getAllByUserId(
        admin.id,
      );
      expect(previousUserLocations).not.toEqual(newUserLocations);
    });

    it('should assign user to location', async () => {
      const created = await userLocationService.create(
        admin.id,
        location.id,
        admin.id,
      );
      expect(created).toHaveProperty('id');
      const assignments = await userLocationService.getAllByUserId(admin.id);
      expect(assignments).not.toHaveLength(0);
    });

    it(`should update user's location assignment`, async () => {
      const assignments = await userLocationService.getAllByUserId(admin.id);
      const oldAssignment = assignments[0];
      await userLocationService.update(oldAssignment.id, admin.id, location.id);
      const updatedAssignment = await userLocationService.getOne(
        oldAssignment.id,
      );
      expect(updatedAssignment.location.id).toEqual(location.id);
    });

    it('should soft delete assignment', async () => {
      const modifiedBy = await userService.findByEmail('gd_admin@isbx.com');
      const modifiedById = modifiedBy.id;
      const assignments = await userLocationService.getAllByUserId(admin.id);
      const deletedAssignment = assignments[0];
      await userLocationService.delete(assignments[0], modifiedById);
      const freshAssignments = await userLocationService.getAllByUserId(
        admin.id,
      );
      expect(freshAssignments).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: deletedAssignment.id }),
        ]),
      );
    });

    it('should get all not deleted assignments', async () => {
      const all = await userLocationService.getAll();
      expect(all).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ deleted: true })]),
      );
    });

    it('should get all not deleted assignments of user', async () => {
      const all = await userLocationService.getAllByUserId(admin.id);
      expect(all).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ deleted: true })]),
      );
    });

    it('should get all users assigned to a location', async () => {
      const LOCATION_ID = 1;
      const all = await userLocationService.getAllUsers(LOCATION_ID);
      expect(all[1]).toBeGreaterThan(0);
    });

    it('should assign existing organization users to location', async () => {
      // assign siteAdmin to organization
      await userLocationService.create(
        siteAdmin.id,
        location.id,
        siteAdmin.modifiedBy,
      );
      // create new location
      const newLocationDetails = {
        name: 'New Location',
        organization: location.organization,
        longLat: '(-66.1204234000111124,18.291058300011111)',
        timezone: 'America/Los_Angeles',
        addressLine1: '123 Santa Anna Blvd',
        city: 'Los Angeles',
        state: { id: 5 },
        postalCode: '90067',
      } as Location;
      // create and auto assign organization users to new location
      const newLocation = await locationService.create(
        newLocationDetails,
        true,
      );
      const [newLocationUsers] = await userLocationService.getAllUsers(
        newLocation.id,
      );
      expect(newLocationUsers).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: siteAdmin.id })]),
      );
    });

    it('should manage organization site admins', async () => {
      const newUser = (await userService.findByEmail(
        'user+e2e@isbx.com',
      )) as User;
      const oldUser = { ...siteAdmin };
      const organizationId = location.organization.id;
      // unassigns existing user and assigns new user
      await locationService.manageOrganizationSiteAdmins(
        organizationId,
        [newUser.id],
        siteAdmin.modifiedBy,
      );
      const [
        currOrganizationLocations,
      ] = await userService.getAssignedOrganizationUsers(organizationId);
      expect(currOrganizationLocations).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: newUser.id })]),
      );
      expect(currOrganizationLocations).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: oldUser.id })]),
      );
    });

    it('should have organization property', async () => {
      await userLocationService.save(admin.id, admin.id, []);
      const assignments: SaveUserLocationsDto['assignments'] = [1, 2];
      await userLocationService.save(admin.id, admin.id, assignments);

      const users: UserLocation[] = await userLocationService.getAllByUserId(
        admin.id,
      );

      users.forEach((user: UserLocation) => {
        expect(user).toHaveProperty('location');
        expect(user.location).toHaveProperty('organization');
      });
    });
  });

  describe('Expected Exceptions', () => {
    // TODO expected expections
  });
});
