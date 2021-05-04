import { find } from 'lodash';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { User } from '../entities/user.entity';
import { UserAddress } from '../entities/user-address.entity';
import { UserController } from './user.controller';
import { UserExceptions } from './user.exceptions';
import { MOCK_USER_DATA } from '../../test/mocks/user.mock';
import {
  EmailNotification,
  MailerNotification,
} from '../notification/notification.service';
import {REGEX_PATIENT_NUMBER, UserService} from './user.service';
import { JwtPayload } from '@sierralabs/nest-identity';
import timekeeper from 'timekeeper';
import { RoleEnum } from '../roles/roles.enum';
import { FreewayService } from './freeway-user/freeway.service';
import { OrganizationPOSId } from './freeway-user/freeway-user.dto';
import { OrganizationService } from '../organization/organization.service';
import { UserLocationService } from '../user-location/user-location.service';
import { LocationService } from '../location';

describe('UserController', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
  let userController: UserController;
  let userService: UserService;
  let userLocationService: UserLocationService;
  let organizationService: OrganizationService;
  let locationService: LocationService;
  let freewayService: FreewayService;
  const testAccount = MOCK_USER_DATA[0]; // admin_e2e
  const normalAccount = MOCK_USER_DATA[1]; // user_e2e
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    userLocationService = module.get<UserLocationService>(UserLocationService);
    organizationService = module.get<OrganizationService>(OrganizationService);
    locationService = module.get<LocationService>(LocationService);
    freewayService = module.get<FreewayService>(FreewayService);
    userService.onModuleInit();
  });
  describe('Unit Tests', () => {
    it('should compose forgot-password email message', async () => {
      const email: MailerNotification = await userService.composeResetPasswordEmail(
        normalAccount as User,
      );
      expect(email.from).toBeTruthy();
      expect(email.to).toBeTruthy();
      expect(email.subject).toBeTruthy();
      expect(email.template).toBeTruthy();
      expect(email.context).toBeTruthy();

      // TODO should we add sending test notification to the AWS Mailbox Simulator?
      // Not implemented because it is counted against the SES billing limit
    });
  });

  describe('Happy Path Cases', () => {
    let user;
    it('should login', async () => {
      const loginDto = {
        email: testAccount.email,
        password: testAccount.password,
      };
      const jwtToken = await userController.login(loginDto);
      expect(jwtToken).toHaveProperty('accessToken');
    });

    it('should register', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User${ts}`,
          lastName: `Testbot`,
          email: `user${ts}@isbx.com`,
          password: `password`,
        },
      };
      user = await userController.register(info);
      expect(user.id).toBeTruthy();
    });

    it('should change password', async () => {
      const userData = await userService.findByEmail(user.email, {
        selectPassword: true,
      });
      await userService.updatePassword('password', 'newPassword', user.email);

      const result = await userService.findById(userData.id);
      expect(result.password).not.toBe(userData.password);
    });

    it('should update/set new password', async () => {
      const userData = await userService.findByEmail(user.email, {
        selectPassword: true,
      });
      const DEFAULT_TOKEN_EXPIRY = {
        value: '10m',
        description: 'ten minutes',
      };
      const token = await userService.createToken(
        { userId: userData.id, email: userData.email } as JwtPayload,
        DEFAULT_TOKEN_EXPIRY.value,
      );
      const newPassword = 'myNewPassword';
      const result = await userController.setPassword(
        newPassword,
        token.accessToken,
      );
      expect(result).toEqual(true);
    });

    it('should verify the token validity and return token info', async () => {
      const userId = 1;
      const email = 'user001@mail.com';

      const DEFAULT_TOKEN_EXPIRY = {
        value: '10m',
        description: '10 minutes',
      };
      const token = await userService.createToken(
        { userId, email } as JwtPayload,
        DEFAULT_TOKEN_EXPIRY.value,
      );
      const result = await userService.verifyToken(token.accessToken);

      expect(result).toBeTruthy();
      expect(result.userId).toBe(userId);
      expect(result.email).toBe(email);
    });

    it('should change to not verified on mobile number change', async () => {
      const verifiedUser = await userService.update({
        id: user.id,
        verified: true,
      } as User);
      expect(verifiedUser.verified).toBe(true);

      // generate random last 4 digits
      let newNumber = null;
      const possibleCharacters = '0123456789';
      for (let i = 0; i < 4; i++) {
        newNumber += possibleCharacters.charAt(
          Math.floor(Math.random() * possibleCharacters.length),
        );
      }

      // must not be the same as previous number. Just rerun the test if it matches
      expect(verifiedUser.mobileNumber).not.toBe(`+1-222-555-${newNumber}`);

      await userService.update({
        id: user.id,
        mobileNumber: `+1-222-555-${newNumber}`,
      } as User);

      const result = await userService.findById(verifiedUser.id);
      expect(result.verified).not.toBe(true);
    });

    it('should not affect "VERIFIED" on other updates other than mobile number', async () => {
      const verifiedUser = await userService.update({
        id: user.id,
        verified: true,
      } as User);
      expect(verifiedUser.verified).toBe(true);

      let newNumber = ''; // generate random 8 digit suffix
      const possibleCharacters = '0123456789';
      for (let i = 0; i < 8; i++) {
        newNumber += possibleCharacters.charAt(
          Math.floor(Math.random() * possibleCharacters.length),
        );
      }

      await userService.update({
        id: user.id,
        patientNumber: `PA18-${newNumber}`,
      } as User);

      const result = await userService.findById(verifiedUser.id);
      expect(result.verified).toBe(true); // should remain true.
    });

    it('should not affect "UNVERIFIED" on other updates other than mobile number', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User-${ts}`,
          lastName: `Testbot`,
          email: `user${ts}@isbx.com`,
          password: `password`,
          verified: false,
        },
      };
      /// userService.create() has verified by default,
      // so lets go through register() Happy Path to be unverified.
      const unverifiedUser = await userController.register(info);
      expect(unverifiedUser.verified).toBe(false);

      // do some updates
      await userService.update({
        id: unverifiedUser.id,
        lastName: 'UnverifiedBot',
      } as User);

      const result = await userService.findById(unverifiedUser.id);
      expect(result.verified).toBe(false); // should remain false.
    });

    it('should verify a user with verification code', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new User(),
        ...{
          firstName: `User-${ts}`,
          lastName: `Testbot`,
          email: `user+${ts}@isbx.com`,
          password: `password`,
          mobileNumber: '+17775550000',
          verified: false,
        },
      };
      /// userService.create() has verified by default,
      // so lets go through register() Happy Path to be unverified.
      const unverifiedUser = await userController.register(info);
      expect(unverifiedUser.verified).toBe(false);

      // generate a new verification code.
      await userService.generateVerificationCode(unverifiedUser.id);
      const unverifiedUserWithCode = (await userService.findById(
        unverifiedUser.id,
      )) as User;

      // use 0000 verification code (only for test and development environments)
      const verifySuccess = await userController.verifyPhone(
        unverifiedUserWithCode.verificationCode || '0000',
        { user: unverifiedUser },
      );
      const verifiedUser = await userService.findById(unverifiedUser.id);
      expect(verifySuccess).toBeTruthy();
      expect(verifiedUser.verified).toBe(true);
    });

    it('should add an address of user', async () => {
      const normalUser = await userService.findByEmail(normalAccount.email);

      const address = new UserAddress();
      address.userId = normalUser.id;
      address.addressLine1 = 'Somewhere2';
      address.city = 'Over';
      address.state = { id: 52 } as any;

      const savedAddress = await userController.addAddress(
        normalUser.id,
        address,
        { user: normalUser },
      );

      expect(savedAddress).toBeTruthy();
      expect(savedAddress.id).toBeDefined();
    });

    it('get all addresses of user', async () => {
      const normalUser = await userService.findByEmail(normalAccount.email);
      const addresses = await userController.getAddresses(normalUser.id, {
        user: normalUser,
      });

      expect(addresses).toEqual(
        expect.arrayContaining([expect.any(UserAddress)]),
      );
    });

    it('should update user address', async () => {
      const normalUser = await userService.findByEmail(normalAccount.email);
      const addresses = await userController.getAddresses(normalUser.id, {
        user: normalUser,
      });
      expect(addresses.length).toBeGreaterThan(0);
      const address = addresses[0];
      address.addressLine1 = 'updated';

      await userService.updateUserAddress(address);

      const updatedAddress = await userService.getUserAddressById(
        normalUser.id,
        address.id,
      );

      expect(updatedAddress.addressLine1).toEqual(address.addressLine1);
    });

    it('should delete an address of user', async () => {
      const normalUser = await userService.findByEmail(normalAccount.email);
      const addresses = await userController.getAddresses(normalUser.id, {
        user: normalUser,
      });
      expect(addresses.length).toBeGreaterThan(0);
      const address = addresses[0];

      await userService.deleteUserAddress(normalUser.id, address.id);

      const deletedAddress = await userService.getUserAddressById(
        normalUser.id,
        address.id,
      );
      expect(deletedAddress.isActive).toBeFalsy();
    });

    it('should get assigned users', async () => {
      const adminUser = await userService.findByEmail('gd_admin@isbx.com');
      const siteAdminUser = await userService.findByEmail(
        'gd_site_admin@isbx.com',
      );
      const [[assignedLocation]] = await locationService.findWithFilter({
        search: 'NextGen Dispensary',
      });
      await userLocationService.save(siteAdminUser.id, adminUser.id, [
        assignedLocation.id,
      ]);
      const assignedLocations = await userController.getLocations(
        siteAdminUser.id,
        null,
      );
      expect(assignedLocations.length).toBeGreaterThan(0);
      const existingUserLocation = assignedLocations.filter(
        userLocation =>
          userLocation.location.id === assignedLocation.id &&
          userLocation.user.id === siteAdminUser.id,
      );
      expect(existingUserLocation.length).toBe(1); // Check if user duplicated
    });

    it('should get user reward list', async () => {
      const normalUser = (await userService.findByEmail(
        normalAccount.email,
      )) as User;
      const result = await freewayService.getRewardPoints(normalUser);

      expect(result.length).not.toBeLessThanOrEqual(0);
    });

    it('should get user reward dto for an org pos id', async () => {
      const orgPosId = Number(OrganizationPOSId.BFriends);
      const normalUser = (await userService.findByEmail(
        normalAccount.email,
      )) as User;

      const result = await freewayService.getRewardPointsByOrgId(
        normalUser,
        orgPosId,
      );

      expect(result).toHaveProperty('orgPosId');
      expect(result.orgPosId).toEqual(orgPosId);
      expect(result.totalPoints).toBeGreaterThanOrEqual(0);
    });

    xit('should get users assigned to locations under organization', async () => {
      const [[organization]] = await organizationService.findWithFilter({
        search: 'Clinica Verde (test)',
      });
      const organizationId = organization.id;
      const [organizationLocations] = await locationService.findWithFilter({
        organizationId,
      });
      const [
        organizationUsers,
      ] = await userService.getAssignedOrganizationUsers(organizationId);
      // gets all user with their assigned locations.
      const locationUsers = await userLocationService.getAll();
      let isAllAssignedUserIncluded = true;
      locationUsers.map(locationUser => {
        const userLocation = locationUser.location;
        if (userLocation) {
          const userLocationId = userLocation.id;
          const isOrganizationLocation = organizationLocations.find(
            location => location.id === userLocationId,
          );
          // checks if current location of user is part of organization.
          if (isOrganizationLocation) {
            /* TODO: Fix condition matched the user id (orgUser and locationUser)
               locationUser.id => locationUser.user.id */
            const existingOrgUsers = organizationUsers.filter(
              orgUser => orgUser.id === locationUser.id,
            );
            // should not be duplicated
            expect(existingOrgUsers.length).toBe(1);
            // checks if current location is included in get of getAssignedOrganizationUsers.
            if (!existingOrgUsers) isAllAssignedUserIncluded = false;
          }
        }
      });
      expect(isAllAssignedUserIncluded).toBeTruthy();
    });
  });

  describe('Expected Exceptions', () => {
    it('should fail registering with missing required properties', async () => {
      const newUser = {
        email: 'incomplete@isbx.com',
        password: '123123',
      } as User;
      const { requiredPropertiesMissing: EXPECTED } = UserExceptions;
      expect.assertions(2); // assures that assertions get called in an async method
      try {
        await userController.register(newUser);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should fail registering the same email', async () => {
      const newUser = {
        email: testAccount.email,
        password: '123123',
        firstName: 'Duplicate',
        lastName: 'Account',
      } as User;
      const { accountExists: EXPECTED } = UserExceptions;
      expect.assertions(2); // assures that assertions get called in an async method
      try {
        await userController.register(newUser);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should fail login for unregistered accounts', async () => {
      const { loginFailed: EXPECTED } = UserExceptions;
      expect.assertions(2); // assures that assertions get called in an async method
      try {
        const loginDto = {
          email: 'unregistered@mail.com',
          password: 'password',
        };
        await userController.login(loginDto);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should fail login for incorrect password', async () => {
      const { loginFailed: EXPECTED } = UserExceptions;
      expect.assertions(2); // assures that assertions get called in an async method
      try {
        const loginDto = { email: testAccount.email, password: 'incorrect' };
        await userController.login(loginDto);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not change password if old password enter was incorrect', async () => {
      const { passwordIncorrect: EXPECTED } = UserExceptions;
      expect.assertions(2); // assures that assertions get called in an async method
      try {
        await userService.updatePassword(
          'incorrectPassword',
          'password',
          'admin_e2e@isbx.com',
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not change password when token is expired', async () => {
      const user = await userService.findByEmail('admin_e2e@isbx.com');
      const DEFAULT_TOKEN_EXPIRY = {
        value: '10m',
        description: 'ten minutes',
      };
      const token = await userService.createToken(
        { userId: user.id, email: user.email } as JwtPayload,
        DEFAULT_TOKEN_EXPIRY.value,
      );
      const currentTime = new Date();
      currentTime.setMinutes(currentTime.getMinutes() + 10); // Add 10 minutes

      const { tokenExpired: EXPECTED } = UserExceptions;
      try {
        timekeeper.travel(new Date());
        await userController.setPassword('password', token.accessToken);
        timekeeper.reset();
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should fail when token is malformed or incorrect', async () => {
      const { tokenInvalid: EXPECTED } = UserExceptions;
      const malFormedToken =
        'S0mERand07mT0k3nbM1NjQ0OH0.qqd8QYAkr51Ugy5K714DcArCQP8qbIquCp6MDMgl_Bk';
      const password = 'password';
      expect.assertions(2);
      try {
        await userController.setPassword(password, malFormedToken);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not get user reward list for user without POS record', async () => {
      // this account is not part of mock freeway user
      const testUser = (await userService.findByEmail(
        'gd_admin@isbx.com',
      )) as User;
      const result = await freewayService.getRewardPoints(testUser);
      expect(result.length).toBeLessThanOrEqual(0);
    });

    it('should still get user reward dto for user without POS record', async () => {
      const orgPosId = Number(OrganizationPOSId.BFriends);
      // this account is not part of mock freeway user
      const testUser = (await userService.findByEmail(
        'gd_admin@isbx.com',
      )) as User;

      const result = await freewayService.getRewardPointsByOrgId(
        testUser,
        orgPosId,
      );
      expect(result).toHaveProperty('orgPosId', orgPosId);
      expect(result.totalPoints).toBeGreaterThanOrEqual(0);
    });

    it('should return an empty reward default for missing or unsupported orgPosId', async () => {
      const orgPosId = -100; // unsupported organization POS Id
      const normalUser = (await userService.findByEmail(
        normalAccount.email,
      )) as User;
      const result = await freewayService.getRewardPointsByOrgId(
        normalUser,
        orgPosId,
      );
      expect(result).toBeFalsy();
    });
  });

  describe('Edge Cases - User Search', () => {
    const ts1 = +new Date(); // force milliseconds
    // create special user for searching only
    const findUserInfo = {
      ...new User(),
      ...{
        firstName: `FindUser${ts1}`,
        lastName: `(FindTestbot)`,
        email: `finduser${ts1}@isbx.com`,
        password: `password`,
      },
    };
    let userToFind = null;

    beforeAll(
      async () => (userToFind = await userController.register(findUserInfo)),
    );
    afterAll(async () => await userService.remove(userToFind.id, 1));

    it('should search user by first name', async () => {
      expect(userToFind.id).toBeTruthy();
      const findUser = await userController.getAllWithRole(
        null,
        null,
        '',
        findUserInfo.firstName,
        false,
      );

      expect(
        find(findUser[0], {
          id: userToFind.id,
        }),
      ).not.toBeUndefined();
    });

    it('should search user by last name with symbol', async () => {
      expect(userToFind.id).toBeTruthy();
      const findUser = await userController.getAllWithRole(
        null,
        null,
        '',
        findUserInfo.lastName,
        false,
      );

      expect(
        find(findUser[0], {
          id: userToFind.id,
        }),
      ).not.toBeUndefined();
    });

    it('should find users with whole name', async () => {
      expect(userToFind.id).toBeTruthy();
      // find using both
      const findUser = await userController.getAllWithRole(
        null,
        null,
        '',
        `${findUserInfo.firstName} ${findUserInfo.lastName}`,
        false,
      );
      expect(
        find(findUser[0], {
          id: userToFind.id,
        }),
      ).not.toBeUndefined();
    });
  });
});
