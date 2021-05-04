import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLocation } from '../entities/user-location.entity';
import { RolesModule } from '../roles/roles.module';
import { UserLocationService } from './user-location.service';
import { UserRoleModule } from '../user-role/user-role.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserLocation]),
    forwardRef(() => RolesModule),
    UserRoleModule,
    forwardRef(() => UserModule),
  ],
  providers: [UserLocationService],
  exports: [UserLocationService],
})
export class UserLocationModule {}
