import { Controller } from '@nestjs/common';
import { RolesController as BaseRolesController } from '@sierralabs/nest-identity';
import { RolesService } from './roles.service';

@Controller('users/roles')
export class RolesController extends BaseRolesController {
  constructor(protected readonly roleService: RolesService) {
    super(roleService);
  }
}
