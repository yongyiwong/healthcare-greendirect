import { TestingModule } from '@nestjs/testing';
import faker from 'faker';

import { PromoBanner } from '../../src/entities/promo-banner.entity';
import { RANDOM_SEQUENCE_OPTION } from '../../src/promo-banner/promo-banner.dto';
import { FixtureService } from '../utils/fixture.service';

export class PromoBannerMock {
  private fixtureService: FixtureService;

  constructor(private readonly module: TestingModule) {
    this.fixtureService = this.module.get<FixtureService>(FixtureService);
  }

  async generate() {
    await this.setupPromoBanners();
  }

  async setupPromoBanners() {
    const activeBanners = [
      {
        bannerUrl: 'https://placekitten.com/1024/240?image=3',
        bannerMobileUrl: 'https://placekitten.com/375/230?image=3',
        backgroundColor: '#c1c7d0',
      },
      {
        bannerUrl: 'https://placedog.net/1024/240?id=61',
        bannerMobileUrl: 'https://placedog.net/375/230?id=61',
        backgroundColor: '#e6e3dd',
      },
      {
        bannerUrl: 'https://placedog.net/1024/240?id=81',
        bannerMobileUrl: 'https://placedog.net/375/230?id=81',
        backgroundColor: '#3b4148',
      },
      {
        bannerUrl: 'https://placedog.net/1024/240?id=98',
        bannerMobileUrl: 'https://placedog.net/375/230?id=98',
        backgroundColor: '#f7d5d5',
        sequenceNumber: RANDOM_SEQUENCE_OPTION,
      },
      {
        bannerUrl: 'https://placedog.net/1024/240?id=48',
        bannerMobileUrl: 'https://placedog.net/375/230?id=48',
        backgroundColor: '#030303',
        sequenceNumber: RANDOM_SEQUENCE_OPTION,
      },
      {
        bannerUrl: 'https://placedog.net/1024/240?id=68',
        bannerMobileUrl: 'https://placedog.net/375/230?id=68',
        backgroundColor: '#846A39',
        sequenceNumber: RANDOM_SEQUENCE_OPTION,
      },
    ];

    for (const banner of activeBanners) {
      await this.fixtureService.saveEntityUsingValues(PromoBanner, {
        sequenceNumber: activeBanners.indexOf(banner) + 1,
        clickUrl: faker.internet.url(),
        isActive: true,
        ...banner,
      });
    }

    for (const i of activeBanners) {
      await this.fixtureService.saveEntityUsingValues(PromoBanner);
    }
  }
}
