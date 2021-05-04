import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DealService } from './deal.service';
import { DealController } from './deal.controller';
import { LocationDeal } from '../entities/location-deal.entity';
import { UserDeal } from '../entities/user-deal.entity';
import { Deal } from '../entities/deal.entity';
import { NotificationService } from '../notification/notification.service';
import { UserModule } from '../user';
import { DealDay } from '../entities/deal-day.entity';
import { LocationModule } from '../location';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deal, LocationDeal, UserDeal, DealDay]),
    UserModule,
    LocationModule,
  ],
  providers: [DealService, NotificationService],
  controllers: [DealController],
  exports: [DealService],
})
export class DealModule {}
