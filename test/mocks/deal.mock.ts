import { TestingModule } from '@nestjs/testing';
import { getRepository, Repository } from 'typeorm';
import { range } from 'lodash';

import { Deal, RANDOM_PRIORITY_OPTION } from '../../src/entities/deal.entity';
import { DealDay } from '../../src/entities/deal-day.entity';
import { Location } from '../../src/entities/location.entity';
import { LocationDeal } from '../../src/entities/location-deal.entity';
import { FixtureService } from '../utils/fixture.service';

const LOCATIONS_WITH_COUPONS = ['NextGen Dispensary', 'BWell Ocean', 'ISBX'];

export class DealMock {
  private fixtureService: FixtureService;
  private locationRepository: Repository<Location>;

  constructor(private readonly module: TestingModule) {
    this.fixtureService = this.module.get<FixtureService>(FixtureService);
    this.locationRepository = getRepository<Location>(Location);
  }

  async generate() {
    await this.setupDeals();
  }

  async setupDeals() {
    const pattern = `^(?:.*(?:${LOCATIONS_WITH_COUPONS.join('|')}).*)$`;
    const locations = await this.locationRepository
      .createQueryBuilder('location')
      .select()
      .where('location.name ~ :pattern', { pattern })
      .getMany();
    const mockLocations = [locations[0].id, locations[1].id, locations[2].id];

    const mockPromises = range(1, 9).map(mockCount =>
      this.fixtureService.saveEntityUsingValues(Deal, {
        dealLocations: mockLocations.map(id => ({
          location: { id },
        })) as LocationDeal[],
        dealDays: range(0, 7).map(day => ({
          dayOfWeek: day,
          isActive: true,
        })) as DealDay[],
        priority: mockCount < 5 ? mockCount : RANDOM_PRIORITY_OPTION,
      }),
    );
    await Promise.all(mockPromises);
  }
}
