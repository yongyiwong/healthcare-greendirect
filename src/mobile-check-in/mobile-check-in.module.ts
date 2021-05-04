import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MobileCheckIn } from '../entities/mobile-check-in.entity';
import { MobileCheckInService } from './mobile-check-in.service';
import { SynchronizeModule } from '../synchronize/synchronize.module';
import { NotificationService } from '../notification/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([MobileCheckIn]), SynchronizeModule],
  providers: [MobileCheckInService, NotificationService],
  exports: [MobileCheckInService],
})
export class MobileCheckInModule {}
