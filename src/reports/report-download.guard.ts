import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UserService } from '../user';
import { RoleEnum } from '../roles/roles.enum';
import { intersection } from 'lodash';

@Injectable()
export class ReportDownloadGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  /**
   * Query @param userId - currently logged-in user's id (roles to be queried via userId)
   * and @param accessToken
   * are used for security verification
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.query.accessToken || '';
    const userId = req.query.userId || null;
    if (userId) {
      const userData = await this.userService.findById(userId);
      const userRoles = userData.roles.map(ur => {
        return ur.name;
      });
      try {
        const { SiteAdmin, Admin } = RoleEnum;
        const allowedUserRoles = intersection([SiteAdmin, Admin], userRoles)
          .length;
        if (!!allowedUserRoles) {
          return this.userService.verifyToken(token);
        }
      } catch (error) {
        throw error;
      }
    }

    return false;
  }
}
