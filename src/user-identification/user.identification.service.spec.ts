import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { Location } from '../entities/location.entity';
import { User } from '../entities/user.entity';
import { UserService } from '../user/user.service';
import { UserIdentificationService } from './user.identification.service';
import { UserIdentification } from '../entities/user-identification.entity';
import { MOCK_USER_DATA } from '../../test/mocks/user.mock';
import { UserIdentificationType } from '../user/freeway-user/freeway-user.dto';
import { result } from 'lodash';

describe('UserIdentificationService', () => {
    let userIdentificationService: UserIdentificationService;
    let userService: UserService;
    let user;
    let userIdentification: UserIdentification;
    const userIdentificationAccount = MOCK_USER_DATA[2]; // user+e2e@isbx.com

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      userIdentificationService = module.get<UserIdentificationService>(UserIdentificationService);
      userService = module.get<UserService>(UserService);

      user = await userService.findByEmail(userIdentificationAccount.email);

      const newUserIdentification = new UserIdentification();
      newUserIdentification.user = new User();
      newUserIdentification.user.id = user.id;
      newUserIdentification.number = '123';
      newUserIdentification.location = new Location();
      newUserIdentification.location.id = 1;
      newUserIdentification.isActive = true;
      newUserIdentification.type = UserIdentificationType.MED;
      userIdentification = await userIdentificationService.createIdentification( newUserIdentification );
    });

    it( 'should get one patient active identification by location', async () => {
      const result = await userIdentificationService.findActivePatientLicenseByLocation( user.id, 1 );
      expect(result).toBeTruthy();
    });

    it( 'should return for patient who has property of isActive=false, deleted=true', async () => {
      userIdentification.isActive = false;
      userIdentification.deleted = null;
      await userIdentificationService.updateIdentification( userIdentification );
      let result = await userIdentificationService.findActivePatientLicenseByLocation( user.id, 1 );
      expect(result).toBeFalsy();

      userIdentification.isActive = true;
      userIdentification.deleted = new Date();
      await userIdentificationService.updateIdentification( userIdentification );
      result = await userIdentificationService.findActivePatientLicenseByLocation( user.id, 1 );
      expect(result).toBeFalsy();
    });

    it( 'should get one patient active identification by organization', async () => {

      userIdentification.isActive = true;
      userIdentification.deleted = null;
      userIdentification.user = user;
      userIdentification.location = new Location();
      userIdentification.location.id = 1;
      await userIdentificationService.updateIdentification( userIdentification );

      const result = await userIdentificationService.findActivePatientLicenseByOrganization( user.id, 1 );

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return for patient who has property of isActive=false, deleted=true', async () => {

      let items: UserIdentification[];

      // check isActive false
      userIdentification.isActive = false;
      userIdentification.deleted = null;
      userIdentification.user = user;
      userIdentification.location = new Location();
      userIdentification.location.id = 1;
      await userIdentificationService.updateIdentification( userIdentification );
      items = await userIdentificationService.findActivePatientLicenseByOrganization(user.id, 1);
      expect(items).toHaveLength(0);

      // check deleted
      userIdentification.isActive = true;
      userIdentification.deleted = new Date();
      userIdentification.user = user;
      userIdentification.location = new Location();
      userIdentification.location.id = 1;
      await userIdentificationService.updateIdentification( userIdentification );
      items = await userIdentificationService.findActivePatientLicenseByOrganization(user.id, 1);
      expect(items).toHaveLength(0);

      // check user
      userIdentification.isActive = true;
      userIdentification.deleted = null;
      userIdentification.user = new User();
      userIdentification.user.id = 6;
      userIdentification.location = new Location();
      userIdentification.location.id = 1;
      await userIdentificationService.updateIdentification( userIdentification );
      items = await userIdentificationService.findActivePatientLicenseByOrganization(user.id, 1);
      expect(items).toHaveLength(0);

      // check location
      userIdentification.user = user;
      userIdentification.isActive = true;
      userIdentification.deleted = null;
      userIdentification.location = new Location();
      userIdentification.location.id = 6; // 2: OrganizationId
      await userIdentificationService.updateIdentification( userIdentification );
      items = await userIdentificationService.findActivePatientLicenseByOrganization(user.id, 1);
      expect(items).toHaveLength(0);

    });

    afterAll(async () => {
      if ( userIdentification ){
        await userIdentificationService.deleteIdentification(userIdentification.id);
      }
    });
});