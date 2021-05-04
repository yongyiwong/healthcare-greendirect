import { Test, TestingModule } from '@nestjs/testing';
import { CampaignMonitorController } from './campaign-monitor.controller';
import { AppModule } from '../app.module';

describe('CampaignMonitor Controller', () => {
  let controller: CampaignMonitorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = module.get<CampaignMonitorController>(
      CampaignMonitorController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
