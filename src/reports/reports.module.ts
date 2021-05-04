import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CsvService } from './csv.service';
import { OrderModule } from '../order/order.module';
import { LocationModule } from '../location';
import { GoogleAnalyticsService } from './google-analytics/google-analytics.service';
import { AppStoreService } from './appstore/appstore.service';
import { GooglePlayService } from './google-play/google-play.service';
import { AppDownload } from '../entities/app-download.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppDownload]),
    OrderModule,
    LocationModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    CsvService,
    AppStoreService,
    GooglePlayService,
    GoogleAnalyticsService,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
