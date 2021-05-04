import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { OrganizationService } from './organization.service';
import { LocationService } from '../location/location.service';
import { UserService } from '../user/user.service';
import { OrganizationExceptions } from './organization.exceptions';
import { GDExpectedException } from '../gd-expected.exception';

describe('OrganizationController', () => {
  let organizationService: OrganizationService;
  let locationService: LocationService;
  let userService: UserService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    organizationService = module.get<OrganizationService>(OrganizationService);
    locationService = module.get<LocationService>(LocationService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(organizationService).toBeDefined();
    expect(userService).toBeDefined();
    expect(locationService).toBeDefined();
  });

  describe('Expected Exceptions', () => {
    it('should fail when site admin is not assigned to an organization', async () => {
      const siteAdmin = await userService.findByEmail('gd_site_admin@isbx.com');
      const [[organization]] = await organizationService.findWithFilter({
        search: 'Clinica Verde (test)',
      });
      // assign site admin to organization
      await locationService.manageOrganizationSiteAdmins(
        organization.id,
        [siteAdmin.id],
        1,
      );
      const siteAdminOrganization = await organizationService.findByAssignedUserId(
        siteAdmin.id,
      );
      const organizationId = 0;
      const { siteAdminNotAssignedToOrg: EXPECTED } = OrganizationExceptions;
      expect.assertions(2); // assures that assertions get called in an async method
      try {
        GDExpectedException.try(
          OrganizationExceptions.siteAdminNotAssignedToOrg,
          {
            organizationId,
            siteAdminOrganization,
          },
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
      // revert assignment of site admin to organization
      await locationService.manageOrganizationSiteAdmins(
        organization.id,
        [],
        1,
      );
    });
  });
});
