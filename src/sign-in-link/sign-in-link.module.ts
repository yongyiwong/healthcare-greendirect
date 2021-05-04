import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { SignInLinkController } from './sign-in-link.controller';
import { SignInLinkService } from './sign-in-link.service';
import { SignInLink } from '../entities/sign-in-link.entity';
import { UserModule } from '../user';
import { NotificationService } from '../notification/notification.service';
import { OrganizationService } from '../organization/organization.service';

@Module({
  imports: [TypeOrmModule.forFeature([SignInLink]), UserModule],
  controllers: [SignInLinkController],
  providers: [SignInLinkService, NotificationService, OrganizationService],
  exports: [SignInLinkService],
})
export class SignInLinkModule {}
