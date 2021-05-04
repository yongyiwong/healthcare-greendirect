import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  UpdateResult,
  TransactionRepository,
  Transaction,
} from 'typeorm';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    protected readonly userRoleRepository: Repository<UserRole>,
  ) {}

  public async getOne(userId: number, roleId: number): Promise<UserRole> {
    let result = null;
    try {
      result = await this.userRoleRepository
        .createQueryBuilder()
        .where('user_id = :userId AND role_id = :roleId', {
          userId,
          roleId,
        })
        .getRawOne();
    } catch (error) {
      throw error;
    }
    return new Promise<UserRole>(resolve => resolve(result));
  }

  public async create(userRole: UserRole): Promise<UserRole> {
    let result = null;
    try {
      result = await this.getOne(userRole.user.id, userRole.role.id);
      // check if already exist
      if (!result) {
        result = this.userRoleRepository.save(userRole);
      }
    } catch (error) {
      throw error;
    }
    return new Promise<UserRole>(resolve => resolve(result));
  }

  public async update(
    userId: number,
    oldRoleId: number,
    newRoleId: number,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      result = await this.getOne(userId, newRoleId);
      // check if already exist
      if (!result) {
        result = await this.userRoleRepository
          .createQueryBuilder()
          .update(UserRole)
          .set({
            role: {
              id: newRoleId,
            },
          })
          .where('user_id = :userId AND role_id = :oldRoleId', {
            userId,
            oldRoleId,
          })
          .execute();
      }
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  @Transaction()
  public async upsert(
    userRole: UserRole,
    @TransactionRepository(UserRole) userRoleRepository?: Repository<UserRole>,
  ): Promise<UserRole> {
    await userRoleRepository.delete({ user: userRole.user });
    return userRoleRepository.save(userRole);
  }
}
