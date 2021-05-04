import { Module, HttpModule } from '@nestjs/common';
import { CampaignMonitorController } from './campaign-monitor.controller';
import { CampaignMonitorService } from './campaign-monitor.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  imports: [HttpModule],
  providers: [CampaignMonitorService, NotificationService],
  controllers: [CampaignMonitorController],
})
export class CampaignMonitorModule {}
