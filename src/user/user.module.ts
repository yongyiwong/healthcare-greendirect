import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '@sierralabs/nest-identity';

import { UserAddress } from '../entities/user-address.entity';
import { User } from '../entities/user.entity';
import { MessageModule } from '../message/message.module';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { RolesModule } from '../roles/roles.module';
import { RolesService } from '../roles/roles.service';
import { UserLocationModule } from '../user-location/user-location.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FreewayModule } from './freeway-user/freeway.module';
import { FreewayService } from './freeway-user/freeway.service';
import { OrganizationService } from '../organization/organization.service';
import { UserIdentificationModule } from '../user-identification/user.idenfication.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAddress]),
    RolesModule,
    MessageModule,
    forwardRef(() => UserLocationModule),
    forwardRef(() => UserIdentificationModule),
    FreewayModule,
  ],
  providers: [
    UserService,
    RolesService,
    AuthService,
    NotificationService,
    MessageService,
    FreewayService,
    OrganizationService,
    Logger,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
