import { TestingModule } from '@nestjs/testing';

import { UserService } from '../../src/user/user.service';
import { SignInLinkService } from '../../src/sign-in-link/sign-in-link.service';
import { MOCK_BIOTRACK_USER } from './biotrack-user.mock';
import { MOCK_FREEWAY_USER } from './freeway-user.mock';

export class SignInLinkMocks {
  private userService: UserService;
  private signInLinkService: SignInLinkService;

  constructor(private readonly module: TestingModule) {
    this.userService = module.get<UserService>(UserService);
    this.signInLinkService = module.get<SignInLinkService>(SignInLinkService);
  }

  async generate() {
    await this.setupSignInLinks();
  }

  async setupSignInLinks() {
    const userEmailsMock = [
      MOCK_FREEWAY_USER[0].email,
      MOCK_BIOTRACK_USER[0].email,
    ];

    for (const email of userEmailsMock) {
      const user = await this.userService.findByEmail(email);
      await this.signInLinkService.createByUserId(user.id);
    }
  }
}
