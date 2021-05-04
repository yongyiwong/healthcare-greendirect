import * as _ from 'lodash';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FreewayUser } from '../../entities/freeway-user.entity';
import { FreewayUserIdentification } from '../../entities/freeway-user-identification.entity';
import { User } from '../../entities/user.entity';
import {
  UserRewardsPointsDto,
  OrganizationPOSId,
  OrganizationPOSDetail,
} from '../../user/freeway-user/freeway-user.dto';

@Injectable()
export class FreewayService {
  constructor(
    @InjectRepository(FreewayUser)
    private readonly freewayUserRepository: Repository<FreewayUser>,
  ) {}

  async getRewardPointsByOrgId(
    user: User,
    orgPosId: number,
  ): Promise<UserRewardsPointsDto> {
    if (orgPosId in OrganizationPOSId) {
      const defaultEmpty = {
        orgPosId,
        orgName: OrganizationPOSDetail[orgPosId as OrganizationPOSId].name,
        totalPoints: 0,
      };
      const rewards = await this.getRewardPoints(user, orgPosId);
      return _.defaultTo(_.first(rewards), defaultEmpty);
    }

    // Unsupported POS Id is received, just fail gracefully with empty
    // Avoid GDExpectedException to prevent triggering a snackbar
    return null;
  }

  async getRewardPoints(
    user: User,
    orgPosId?: number,
  ): Promise<UserRewardsPointsDto[]> {
    try {
      const query = this.freewayUserRepository
        .createQueryBuilder('freeway_user')
        .where('email = LOWER(:email) AND active = true', {
          email: user.email,
        });

      if (orgPosId) {
        query.andWhere('org_id = :orgPosId', { orgPosId });
      }
      const freewayUserOrgPoints = await query.getMany();
      const rewardsPoints: UserRewardsPointsDto[] = freewayUserOrgPoints
        .filter(fwUser => fwUser.orgId in OrganizationPOSId)
        .map(fwUser => {
          return {
            orgPosId: fwUser.orgId,
            orgName:
              OrganizationPOSDetail[fwUser.orgId as OrganizationPOSId].name,
            totalPoints: fwUser.totalPoints || 0,
          };
        });

      return rewardsPoints;
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<FreewayUser> {
    return this.freewayUserRepository.findOne({
      order: { posId: 'ASC' },
      where: { email, active: true },
    });
  }
}
