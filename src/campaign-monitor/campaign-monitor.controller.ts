import { Controller, Param, Post } from '@nestjs/common';
import { CampaignMonitorService } from './campaign-monitor.service';

@Controller('campaign-monitor')
export class CampaignMonitorController {
  constructor(
    private readonly campaignMonitorService: CampaignMonitorService,
  ) {}

  @Post('unsubscribe/:hash')
  public async unsubscribeUser(@Param('hash') hash: string) {
    try {
      return this.campaignMonitorService.unsubscribeUser(hash);
    } catch (error) {
      throw error;
    }
  }

  @Post('subscribe/:hash')
  public async subscribeUser(@Param('hash') hash: string) {
    try {
      return this.campaignMonitorService.subscribeUser(hash);
    } catch (error) {
      throw error;
    }
  }
}
