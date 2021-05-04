import { TestingModule } from '@nestjs/testing';
import { range } from 'lodash';

import { FixtureService } from '../utils/fixture.service';
import { Brand } from '../../src/entities/brand.entity';
import { RANDOM_PRIORITY_OPTION } from '../../src/entities/brand.entity';

export class BrandMock {
  private fixtureService: FixtureService;

  constructor(private readonly module: TestingModule) {
    this.fixtureService = this.module.get<FixtureService>(FixtureService);
  }

  async generate() {
    await this.setupBrands();
  }

  async setupBrands() {
    const mockPromises = range(0, 8).map((brand, index) =>
      this.fixtureService.saveEntityUsingValues(Brand, {
        priority: index < 4 ? index + 1 : RANDOM_PRIORITY_OPTION,
      }),
    );
    await Promise.all(mockPromises);
  }
}
