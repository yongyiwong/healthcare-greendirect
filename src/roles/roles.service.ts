import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesService as BaseRolesService } from '@sierralabs/nest-identity';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesService extends BaseRolesService {
  constructor(
    @InjectRepository(Role) protected readonly roleRepository: Repository<Role>,
  ) {
    super(roleRepository);
  }
}
