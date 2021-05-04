import { Test, TestingModule } from '@nestjs/testing';
import faker from 'faker';

import { AppModule } from '../app.module';
import { SignInLinkService } from './sign-in-link.service';
import { SignInLinkController } from './sign-in-link.controller';
import { UserService } from '../user';
import { User } from '../entities/user.entity';
import { getRepository, Repository } from 'typeorm';
import { SignInLink } from '../entities/sign-in-link.entity';

describe('SignInLink Controller', () => {
  let signInLinkController: SignInLinkController;
  let signInLinkService: SignInLinkService;
  let signInLinkRepository: Repository<SignInLink>;
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    signInLinkController = module.get<SignInLinkController>(
      SignInLinkController,
    );
    signInLinkService = module.get<SignInLinkService>(SignInLinkService);
    userService = module.get<UserService>(UserService);
    signInLinkRepository = getRepository<SignInLink>(SignInLink);
  });

  it('should be defined', () => {
    expect(SignInLinkService).toBeDefined();
    expect(signInLinkController).toBeDefined();
  });

  describe('Sign In Link Unit Tests', () => {
    let mockUser;
    beforeAll(async () => {
      const user = {
        ...new User(),
        ...{
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          email: faker.internet.email(),
          password: '',
        },
      };
      mockUser = await userService.create(user);
    });

    it('should create a sign in link', async () => {
      const signInLink = await signInLinkService.createByUserId(mockUser.id);
      expect(signInLink).toBeTruthy();
    });

    it('should not create duplicate sign in link', async () => {
      await signInLinkService.createByUserId(mockUser.id);
      const activeSignInLinks = await signInLinkRepository.find({
        where: {
          user: mockUser,
          active: true,
        },
      });
      expect(activeSignInLinks.length).toEqual(1);
    });

    it('should revoke sign in link', async () => {
      const signInLink = await signInLinkService.createByUserId(mockUser.id);
      expect(signInLink).toBeTruthy();

      await signInLinkService.revokeByUserId(mockUser.id);
      const savedSignInLink = await signInLinkService.getActiveByUserId(
        mockUser.id,
      );
      expect(savedSignInLink).toBeFalsy();
    });

    it('should get status of active and regenerated sign in link', async () => {
      const signInLink = await signInLinkService.createByUserId(mockUser.id);
      expect(signInLink).toBeTruthy();

      await signInLinkService.revokeByUserId(mockUser.id);
      const newSignInLink = await signInLinkService.createByUserId(mockUser.id);
      expect(newSignInLink).toBeTruthy();

      const signInLinkStatus = await signInLinkService.getStatusByUserId(
        mockUser.id,
      );
      expect(signInLinkStatus).toBeTruthy();
      expect(signInLinkStatus.isActive).toBeTruthy();
      expect(signInLinkStatus.isRegenerated).toBeTruthy();
    });
  });
});
