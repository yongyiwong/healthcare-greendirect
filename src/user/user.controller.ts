import * as log from 'fancy-log';
import { UpdateResult } from 'typeorm';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  ApiImplicitBody,
  ApiImplicitParam,
  ApiImplicitQuery,
} from '@nestjs/swagger';
import {
  InheritRoles,
  OwnerInterceptor,
  Roles,
  User as BaseUser,
  UserController as BaseUserController,
  JwtToken,
} from '@sierralabs/nest-identity';
import {
  ConfigService,
  ParseBooleanPipe,
  ParseEntityPipe,
  RequiredPipe,
} from '@sierralabs/nest-utils';
import * as _ from 'lodash';

import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { UserAddress } from '../entities/user-address.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { GDExpectedException } from '../gd-expected.exception';
import { MessageService } from '../message/message.service';
import {
  NotificationService,
  TextMessageNotification,
} from '../notification/notification.service';
import { OrganizationService } from '../organization/organization.service';
import { OverrideRoles } from '../roles/override-roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesService } from '../roles/roles.service';
import { SetAsPatientOn } from '../roles/set-as-patient-on.decorator';
import { SaveUserLocationsCompatDto } from '../user-location/dto/save-user-locations-compat.dto';
import { SaveUserLocationsDto } from '../user-location/dto/save-user-locations.dto';
import { UserLocationsDto } from '../user-location/dto/user-locations.dto';
import { UserLocationService } from '../user-location/user-location.service';
import { SaveUserRolesDto } from '../user-role/dto/save-user-roles.dto';
import { UserRoleService } from '../user-role/user-role.service';
import { UserExceptions } from '../user/user.exceptions';
import { UserService } from './user.service';
import { UserRewardsPointsDto } from './freeway-user/freeway-user.dto';
import { FreewayService } from './freeway-user/freeway.service';

const { Admin, SiteAdmin, Employee } = RoleEnum;
@Controller('users')
@InheritRoles()
@OverrideRoles({
  getAll: [Admin, SiteAdmin, Employee],
  getOne: ['$authenticated'],
  update: ['$authenticated'],
  create: [Admin, SiteAdmin],
})
@SetAsPatientOn('register')
export class UserController extends BaseUserController {
  constructor(
    protected readonly userService: UserService,
    protected readonly configService: ConfigService,
    protected readonly notificationService: NotificationService,
    protected readonly rolesService: RolesService,
    protected readonly userLocationService: UserLocationService,
    protected readonly userRoleService: UserRoleService,
    protected readonly messageService: MessageService,
    protected readonly freewayService: FreewayService,
    private readonly organizationService: OrganizationService,
  ) {
    super(userService, configService);
  }

  /**
   * Generate a verification code to send to the user via text message
   * @param request
   */
  @Roles('$authenticated')
  @Post('/send/phone/verification')
  public async sendVerificationCodeByText(@Req() request): Promise<boolean> {
    const verificationCode = await this.userService.generateVerificationCode(
      request.user.id,
    );
    const textMessageNotification: TextMessageNotification = {
      phoneNumber: request.user.mobileNumber,
      message: `Verification Code: ${verificationCode}`,
    };

    return this.notificationService.sendTextMessage(textMessageNotification);
  }

  /**
   * Generate a verification code to send to the user via email
   * @param request
   */
  @Roles('$authenticated')
  @Post('/send/email/verification')
  public async sendVerificationCodeByEmail(@Req() request): Promise<boolean> {
    const verificationCode = await this.userService.generateVerificationCode(
      request.user.id,
    );
    return this.userService.sendValidationCodeEmail(
      request.user,
      verificationCode,
      request.user.locale,
    );
  }

  /**
   * verify the user's phone number with a verification code that was
   * sent to the user's phone via text message.
   * @param verificationCode
   * @param request
   */
  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      verificationCode: string;
      new() {}
    },
  })
  @Roles('$authenticated')
  @Post('/verify/phone')
  public async verifyPhone(
    @Body('verificationCode') verificationCode: string,
    @Req() request,
  ): Promise<boolean> {
    if (!verificationCode) {
      return false;
    }
    const userId = +request.user.id;
    return this.userService.verifyMobileNumber(userId, verificationCode);
  }

  /**
   * verify the user's phone number with a verification code that was
   * sent to the user's phone via text message.
   * @param verificationCode
   * @param request
   */
  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      verificationCode: string;
      new() {}
    },
  })
  @Roles('$authenticated')
  @Post(':id([0-9]+|me)/verify/phone')
  public async verifyUserPhone(
    @Param('id') userId: number | string,
    @Req() request,
    @Body('verificationCode') verificationCode?: string,
  ): Promise<boolean> {
    const user = request.user;
    if (userId === 'me' || user.id === +userId) {
      userId = user.id;
    } else {
      GDExpectedException.try(UserExceptions.noAdminRights, {
        userRoles: user.roles,
        allowedRoles: [Admin, SiteAdmin],
      });
    }

    try {
      if (!verificationCode) {
        GDExpectedException.try(UserExceptions.noAdminRights, {
          userRoles: user.roles,
          allowedRoles: [Admin, SiteAdmin],
        });
      }
    } catch (error) {
      // dont throw back up, reject silently
      return false;
    }

    return this.userService.verifyMobileNumber(+userId, verificationCode);
  }

  /**
   * Request a password reset using email address
   * @param email The user's email address
   */
  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      email: string;
      new() {}
    },
  })
  @Post('reset')
  public async resetPasswordRequest(
    @Body('email') email: string,
  ): Promise<boolean> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return true; // always resolve true to prevent spoofing attachs
    }
    const gdUser = user as User;
    const locale = gdUser.locale;
    const emailNotification = await this.userService.composeResetPasswordEmail(
      gdUser,
      locale,
    );
    return new Promise<boolean>((resolve, reject) => {
      this.notificationService
        .sendEmailMessage(emailNotification, locale)
        .then(data => {
          resolve(true);
        })
        .catch(error => {
          log.error(error.stack);
          resolve(true); // always resolve true to prevent spoofing attacks
        });
    });
  }

  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      oldPassword: string;
      newPassword: string;
      new() {}
    },
  })
  @Roles('$authenticated')
  @Put('reset/password')
  @HttpCode(204)
  public async changePassword(
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
    @Req() request,
  ): Promise<User> {
    const email = request.user.email;
    return this.userService.updatePassword(oldPassword, newPassword, email);
  }

  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      password: string;
      token: string;
      new() {}
    },
  })
  @Put('reset/set-password')
  @HttpCode(204)
  public async setPassword(
    @Body('password') password: string,
    @Body('token') token: string,
  ): Promise<any> {
    try {
      const { email } = await this.userService.verifyToken(token);
      if (email) {
        await this.userService.setPassword(email, password);
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get(':id([0-9]+|me)/locations')
  @HttpCode(200)
  @ApiImplicitParam({ name: 'id', type: String })
  public async getLocations(
    @Param('id') id: number | string,
    @Req() request,
  ): Promise<UserLocationsDto[]> {
    if (id === 'me') {
      id = request.user.id;
    }
    id = +id;
    return this.userLocationService.getAllByUserId(id);
  }

  @Roles(Admin, SiteAdmin)
  @Put(':id([0-9]+)/locations')
  @HttpCode(200)
  public async saveLocations(
    @Param('id', new ParseIntPipe()) userId: number,
    @Body() saveUserLocationsDto: SaveUserLocationsDto,
    @Req() request,
  ) {
    const { assignments } = saveUserLocationsDto;
    const modifiedBy = +request.user.id;
    return this.userLocationService.save(userId, modifiedBy, assignments);
  }

  @Roles(Admin, SiteAdmin)
  @Put(':id([0-9]+)/roles')
  @HttpCode(200)
  public async saveRoles(
    @Param('id', new ParseIntPipe()) userId: number,
    @Body() saveUserRolesDto: SaveUserRolesDto,
  ) {
    const { roles } = saveUserRolesDto;
    const roleName = roles[0];
    const userRole = new UserRole();
    userRole.user = (await this.userService.findById(userId)) as User;
    userRole.role = (await this.rolesService.findByName(roleName)) as Role;

    return this.userRoleService.upsert(userRole);
  }

  @Roles('$authenticated')
  @Get(':id([0-9]+)/addresses/:addressId([0-9]+)')
  public async getAddress(
    @Param('id') userId: number | string,
    @Param('addressId', new ParseIntPipe()) addressId: number,
    @Req() request,
  ): Promise<UserAddress> {
    const user = request.user;
    if (userId === 'me' || user.id === +userId) {
      userId = user.id;
    } else {
      GDExpectedException.try(UserExceptions.noAdminRights, {
        userRoles: user.roles,
        allowedRoles: [Admin],
      });
    }
    userId = +userId;
    return this.userService.getUserAddressById(userId, addressId);
  }

  @Roles('$authenticated')
  @Get(':id([0-9]+|me)/addresses')
  public async getAddresses(
    @Param('id') userId: number | string,
    @Req() request,
  ): Promise<UserAddress[]> {
    const user = request.user;
    if (userId === 'me' || user.id === +userId) {
      userId = user.id;
    } else {
      GDExpectedException.try(UserExceptions.noAdminRights, {
        userRoles: user.roles,
        allowedRoles: [Admin],
      });
    }
    userId = +userId;
    return this.userService.getUserAddresses(userId);
  }

  @Roles('$authenticated')
  @Post(':id([0-9]+|me)/addresses')
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  public async addAddress(
    @Param('id') userId: number | string,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: false } }),
    )
    userAddress: UserAddress,
    @Req() request,
  ): Promise<UserAddress> {
    const user = request.user;
    if (userId === 'me' || user.id === +userId) {
      userId = user.id;
    } else {
      GDExpectedException.try(UserExceptions.noAdminRights, {
        userRoles: user.roles,
        allowedRoles: [Admin],
      });
    }
    userId = +userId;
    userAddress.userId = userId;
    return this.userService.createUserAddress(userAddress);
  }

  @Roles('$authenticated')
  @Put(':id([0-9]+|me)/addresses/:addressId([0-9]+)')
  @UseInterceptors(new OwnerInterceptor(['modifiedBy']))
  public async updateAddress(
    @Param('id') userId: number | string,
    @Param('addressId', new ParseIntPipe()) addressId: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: false } }),
    )
    userAddress: UserAddress,
    @Req() request,
  ): Promise<UserAddress> {
    const user = request.user;
    if (userId === 'me' || user.id === +userId) {
      userId = user.id;
    } else {
      GDExpectedException.try(UserExceptions.noAdminRights, {
        userRoles: user.roles,
        allowedRoles: [Admin],
      });
    }
    userId = +userId;
    userAddress.id = addressId;
    userAddress.userId = userId;
    return this.userService.updateUserAddress(userAddress);
  }

  @Roles('$authenticated')
  @Delete(':id([0-9]+|me)/addresses/:addressId([0-9]+)')
  @UseInterceptors(new OwnerInterceptor(['modifiedBy']))
  public async deleteAddress(
    @Param('id') userId: number | string,
    @Param('addressId', new ParseIntPipe()) addressId: number,
    @Req() request,
  ): Promise<UpdateResult> {
    const user = request.user;
    if (userId === 'me' || user.id === +userId) {
      userId = user.id;
    } else {
      GDExpectedException.try(UserExceptions.noAdminRights, {
        userRoles: user.roles,
        allowedRoles: [Admin],
      });
    }
    userId = Number(userId);
    return this.userService.deleteUserAddress(userId, addressId);
  }

  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      token: string;
      new() {}
    },
  })
  @Post('/verify/token')
  public async verifyToken(@Body('token') token: string): Promise<boolean> {
    if (!token) {
      return false;
    }
    return new Promise<boolean>((resolve, reject) => {
      this.userService
        .verifyToken(token)
        .then(data => {
          resolve(true);
        })
        .catch(error => {
          resolve(false);
        });
    });
  }

  @Post('/register/check-external-accounts')
  public async checkExternalAccounts(
    @Body('email') email: string,
    @Req() request,
  ): Promise<boolean> {
    try {
      GDExpectedException.try(UserExceptions.emailRequired, email);
      return this.userService.hasExternalAccount(email);
    } catch (error) {
      throw error;
    }
  }

  @ApiImplicitParam({ name: 'token', type: String })
  @Post('/login-with-token/:token')
  public async loginWithToken(
    @Param('token') token: string,
  ): Promise<JwtToken> {
    return this.userService.loginWithToken(token);
  }

  @Roles(SiteAdmin) // Endpoint specially for SiteAdmins only (Admins have the default GET /users endpoint)
  @Get(':id([0-9]+)/assigned-users')
  @UsePipes(new SearchValidationPipe(BaseUser))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitParam({ name: 'id', type: String })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async getAssignedUsers(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<[User[], number]> {
    return this.userService.getAssignedUsers(
      id,
      search,
      page,
      limit,
      order,
      includeDeleted,
    );
  }

  @Get()
  @Roles(Admin)
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async getAllWithRole(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('search') search?: string,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ) {
    const maxSize = this.configService.get('pagination.maxPageSize') || 200;
    const defaultSize =
      this.configService.get('pagination.defaultPageSize') || 100;
    limit = Math.min(maxSize, limit || defaultSize);
    const offset = (page || 0) * limit;

    const orderTransform = {
      'id asc': 'user.id ASC',
      'id desc': 'user.id DESC',
      'email asc': 'user.email ASC',
      'email desc': 'user.email DESC',
      'deleted asc': 'user.deleted ASC',
      'deleted desc': 'user.deleted DESC',
      'roles asc': 'roles.name ASC',
      'roles desc': 'roles.name DESC',
    };

    if (order === undefined) {
      order = 'id asc';
    }
    let orderParam = order.toLowerCase();
    orderParam = orderTransform[orderParam]
      ? orderTransform[orderParam]
      : orderTransform['id asc'];

    const orderParts = orderParam.split(' ');
    const orderConfig = {};
    orderConfig[orderParts[0]] = orderParts[1].toUpperCase();

    const fields = null;

    return this.userService.findWithFilter(
      orderConfig,
      limit,
      offset,
      search,
      fields,
      includeDeleted,
    );
  }

  @Roles('$authenticated')
  @Put('subscribe/marketing')
  public async subscribeMarketing(@Req() request): Promise<User> {
    const user = request.user as User;
    await this.messageService.subscribeToTextMessageMarketing(
      user.id,
      user.mobileNumber,
    );
    // update user subscription preference
    user.isSubscribedToMarketing = true;
    return this.userService.update(user);
  }

  @Roles('$authenticated')
  @Put('unsubscribe/marketing')
  public async unsubscribeMarketing(@Req() request) {
    const user = request.user as User;
    return this.userService.unsubscribeUserFromMarketing(user);
  }

  @Roles('$authenticated')
  @Get(':id([0-9]+|me)/rewards')
  @ApiImplicitParam({ name: 'id', type: Number })
  public async getRewardPoints(
    @Param('id') userId: number | string,
    @Req() request,
  ): Promise<UserRewardsPointsDto[]> {
    try {
      const user = request.user;
      if (userId === 'me' || user.id === +userId) {
        userId = user.id;
      } else {
        GDExpectedException.try(UserExceptions.noAdminRights, {
          userRoles: user.roles,
          allowedRoles: [Admin],
        });
      }
      const rewardPointsList = await this.freewayService.getRewardPoints(user);

      return rewardPointsList;
    } catch (error) {
      throw error;
    }
  }

  @Roles('$authenticated')
  @Get(':id([0-9]+|me)/rewards/:orgPosId')
  @ApiImplicitParam({ name: 'id', type: Number })
  @ApiImplicitParam({ name: 'orgPosId', type: Number })
  public async getRewardPointsByOrgId(
    @Param('id') userId: number | string,
    @Param('orgPosId') orgPosId: number,
    @Req() request,
  ): Promise<UserRewardsPointsDto> {
    try {
      const user = request.user;
      if (userId === 'me' || user.id === +userId) {
        userId = user.id;
      } else {
        GDExpectedException.try(UserExceptions.noAdminRights, {
          userRoles: user.roles,
          allowedRoles: [Admin],
        });
      }
      // TODO: if later we use this in CMS (non-"me" request), we need to retrieve the email of the userId.
      const rewardPointsFromOrg = await this.freewayService.getRewardPointsByOrgId(
        user,
        orgPosId,
      );
      return rewardPointsFromOrg;
    } catch (error) {
      throw error;
    }
  }

  @Roles(SiteAdmin)
  @Get('assigned-organization')
  async findByAssignedUserId(@Req() request): Promise<Organization> {
    return this.organizationService.findByAssignedUserId(request.user.id);
  }
}
