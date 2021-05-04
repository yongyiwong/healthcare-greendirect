import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { UserLocationModule } from '../user-location/user-location.module';

@Module({
  providers: [RolesService],
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => UserLocationModule),
  ],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
