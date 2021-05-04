import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../entities/user-role.entity';
import { UserRoleService } from './user-role.service';

@Module({
  providers: [UserRoleService],
  imports: [TypeOrmModule.forFeature([UserRole])],
  controllers: [],
  exports: [UserRoleService],
})
export class UserRoleModule {}
