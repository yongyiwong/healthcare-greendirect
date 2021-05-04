import * as log from 'fancy-log';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { Environments, isProductionEnv } from '../app.service';
import { MobileCheckIn } from '../entities/mobile-check-in.entity';
import { User } from '../entities/user.entity';
import { GDExpectedException } from '../gd-expected.exception';
import { LocationExceptions } from '../location/location.exceptions';
import { LocationService } from '../location/location.service';
import {
  NotificationService,
  TextMessageNotification,
} from '../notification/notification.service';
import { MjfreewayOrderService } from '../synchronize/mjfreeway/mjfreeway-order.service';

@Injectable()
export class MobileCheckInService {
  constructor(
    @InjectRepository(MobileCheckIn)
    protected mobileCheckInRepository: Repository<MobileCheckIn>,
    private readonly notificationService: NotificationService,
    protected readonly configService: ConfigService,
    private readonly mobileCheckinService: MobileCheckInService,
    private readonly mjfreewayOrderService: MjfreewayOrderService,
    @Inject(forwardRef(() => LocationService))
    private readonly locationService: LocationService,
  ) {}

  async findWithFilter(
    locationId?: number,
    mobileNumber?: string,
    order?: string,
    includeClaimed = false,
  ): Promise<[MobileCheckIn[], number]> {
    try {
      const tableName = 'mobileCheckIn';
      const query = this.mobileCheckInRepository
        .createQueryBuilder(tableName)
        .leftJoinAndSelect(`${tableName}.location`, 'location');

      if (locationId) {
        query.andWhere('location.id = :locationId', { locationId });
      }

      if (mobileNumber) {
        query.andWhere(`${tableName}.mobileNumber ILIKE :mobileNumber`, {
          mobileNumber,
        });
      }

      if (!includeClaimed) {
        // if includeClaimed is not specified, by default retrieve unclaimed only
        query.andWhere(`${tableName}.isClaimed = false`);
      }

      if (order) {
        const key = Object.keys(order)[0];
        order[tableName + '.' + key] = order[key];
        delete order[key];
        query.orderBy(order);
      } else {
        query.orderBy(`${tableName}.id`, 'DESC');
      }

      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  async findById(id: number): Promise<MobileCheckIn> {
    try {
      const tableName = 'mobileCheckIn';
      const query = this.mobileCheckInRepository
        .createQueryBuilder(tableName)
        .leftJoinAndSelect(`${tableName}.location`, 'location')
        .where(`${tableName}.id = :id`, { id });

      return query.getOne();
    } catch (error) {
      throw error;
    }
  }

  async getLatestCheckIn(mobileNumber: string): Promise<MobileCheckIn> {
    try {
      GDExpectedException.try(
        LocationExceptions.mobileNumberRequired,
        mobileNumber,
      );

      const tableName = 'mobileCheckIn';
      const query = this.mobileCheckInRepository
        .createQueryBuilder(tableName)
        .leftJoinAndSelect(`${tableName}.location`, 'location')
        .where(`TRIM(${tableName}.mobileNumber) = TRIM(:mobileNumber)`, {
          mobileNumber,
        })
        .orderBy(`${tableName}.modified`, 'DESC');
      return query.getOne();
    } catch (error) {
      throw error;
    }
  }

  async create(mobileCheckIn: MobileCheckIn): Promise<MobileCheckIn> {
    try {
      delete mobileCheckIn.id;
      return this.mobileCheckInRepository.save(mobileCheckIn);
    } catch (error) {
      throw error;
    }
  }

  async upsert(mobileCheckIn: MobileCheckIn): Promise<MobileCheckIn> {
    try {
      const { mobileNumber } = mobileCheckIn;
      const existingMobileCheckIn: MobileCheckIn = await this.getLatestCheckIn(
        mobileNumber,
      );

      /* NOTE: Repository.save() won't be possible to use here. When a user has an existing check in,
      and has checked in again at the same location, there would be no changes EXCEPT the `modified`
      column. Repository.save() won't trigger the Update if there are no changes in the record, which
      won't update the `modified` column. */

      if (existingMobileCheckIn) {
        delete mobileCheckIn.created;
        await this.mobileCheckInRepository.update(
          { id: existingMobileCheckIn.id },
          mobileCheckIn,
        );
      } else {
        await this.create(mobileCheckIn);
      }

      return this.getLatestCheckIn(mobileNumber);
    } catch (error) {
      throw error;
    }
  }

  async update(mobileCheckIn: MobileCheckIn): Promise<MobileCheckIn> {
    try {
      delete mobileCheckIn.created;
      return this.mobileCheckInRepository.save(mobileCheckIn);
    } catch (error) {
      throw error;
    }
  }

  // WARNING: This is a physical delete. Replace with update() if soft-delete is needed.
  // Deletion of mobile check-in are not yet used.
  async delete(id: number): Promise<DeleteResult> {
    try {
      return this.mobileCheckInRepository.delete(id);
    } catch (error) {
      throw error;
    }
  }

  async checkIn(locationId: number, mobileNumber: string) {
    const checkIn = {
      ...new MobileCheckIn(),
      mobileNumber,
      location: { id: locationId },
      isClaimed: false,
    } as MobileCheckIn;

    const newMobileCheckin = await this.upsert(checkIn);
    return newMobileCheckin;
  }

  async sendSmsConfirmation(
    mobileCheckIn: MobileCheckIn,
    isNewUser: boolean,
  ): Promise<any> {
    if (isProductionEnv()) {
      try {
        const access = isNewUser ? 'sign-up for an account on' : 'sign-in to';
        const clientBaseUrl: string = this.configService.get(
          'email.clientBaseUrl',
        );
        const link = isNewUser
          ? `${clientBaseUrl}/sign-up?checkin=${mobileCheckIn.location.id}-${mobileCheckIn.id}`
          : `${clientBaseUrl}/sign-in`;
        const textMessage: TextMessageNotification = {
          message: `Thanks for checking into ${mobileCheckIn.location.name}, please ${access} GreenDirect to see your rewards. ${link}`,
          phoneNumber: mobileCheckIn.mobileNumber,
        };

        return this.notificationService.sendTextMessage(textMessage);
      } catch (error) {
        throw error;
      }
    }
    return;
  }

  async claimReward(
    user: User,
    mobileNumber: string,
    isFirstTime = false,
  ): Promise<boolean> {
    const checkins = await this.mobileCheckinService.findWithFilter(
      null,
      mobileNumber,
    );
    const count = checkins[1];
    if (!count) {
      // ? throw exception? 'No unclaimed rewards.'
      return false;
    }

    let order = null;
    const unclaimedCheckins = count ? checkins[0] : [];
    // Create 1 MJFreeway order for each unclaimed checkin
    for (const checkin of unclaimedCheckins) {
      const posInfo = await this.locationService.getLocationPosInfo(
        checkin.location.id,
      );
      try {
        if (isProductionEnv({ allow: [Environments.STAGING] })) {
          order = await this.mjfreewayOrderService.submitSpecialOrderForRewards(
            user,
            checkin,
            posInfo,
            isFirstTime,
          );
          if (!order) {
            return false;
          }
        } else {
          log.warn('Claim Reward call to MJF API skipped in non-prod.');
          order = {};
        }

        await this.markCheckinClaimed(order, checkin);
      } catch (err) {
        log.error(`Checkin #${checkin.id} claim reward failed: ${err}`);
      }
    }

    return true;
  }

  async markCheckinClaimed(
    order: any,
    checkin: MobileCheckIn,
  ): Promise<UpdateResult> {
    const changes = { isClaimed: !!order };
    return this.mobileCheckInRepository
      .createQueryBuilder()
      .update(MobileCheckIn)
      .set(changes)
      .where(`id = :id`, { id: checkin.id })
      .execute();
  }
}
