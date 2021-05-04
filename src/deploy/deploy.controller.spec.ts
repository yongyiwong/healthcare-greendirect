import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { DeployService } from './deploy.service';
import { DeployController } from './deploy.controller';

describe('DeployController', () => {
  let module: TestingModule;
  let deployService: DeployService;
  let deployController: DeployController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    deployController = module.get<DeployController>(DeployController);
    deployService = module.get<DeployService>(DeployService);
  });

  it('should be defined', () => {
    const controller: DeployController = module.get<DeployController>(
      DeployController,
    );
    expect(controller).toBeDefined();
    const service: DeployService = module.get<DeployService>(DeployService);
    expect(service).toBeDefined();
  });
});
