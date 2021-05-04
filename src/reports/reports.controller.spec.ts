import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { AppModule } from '../app.module';

describe('Reports Controller', () => {
  let reportsController: ReportsController;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    reportsController = module.get<ReportsController>(ReportsController);
  });

  describe('Reports Unit Tests', () => {
    xit('should have one unit test', () => {
      // TODO replace with correct test.
      expect(1).toBeTruthy();
    });
  });
});
