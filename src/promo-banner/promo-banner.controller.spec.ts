import { Test, TestingModule } from '@nestjs/testing';
import { PromoBannerController } from './promo-banner.controller';
import { AppModule } from '../app.module';
import { PromoBannerService } from './promo-banner.service';
import { PromoBanner } from '../entities/promo-banner.entity';

describe('PromoBanner Controller', () => {
  let promoBannerController: PromoBannerController;
  let promoBannerService: PromoBannerService;

  const INCLUDE_INACTIVE = true;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    promoBannerController = module.get<PromoBannerController>(
      PromoBannerController,
    );
    promoBannerService = module.get<PromoBannerService>(PromoBannerService);
  });

  it('should be defined', () => {
    expect(promoBannerService).toBeDefined();
    expect(promoBannerController).toBeDefined();
  });

  describe('Promo Banner Unit Tests', () => {
    it('should create a promo banner', async () => {
      const mock = {
        ...new PromoBanner(),
        name: 'Create Promo Banner',
      };

      const newPromoBanner = await promoBannerService.create(mock);
      expect(newPromoBanner.name).toBe(mock.name);
    });

    it('should get all promo banners', async () => {
      const mock = {
        ...new PromoBanner(),
        name: 'Get Promo Banners',
      };
      await promoBannerService.create(mock);

      const promoBanners = await promoBannerService.findWithFilter(
        null,
        null,
        null,
        null,
        INCLUDE_INACTIVE,
      );
      expect(promoBanners).toBeTruthy();
      expect(promoBanners.length).toBeGreaterThan(0);
    });

    it('should search promo banners by name', async () => {
      const mock = {
        ...new PromoBanner(),
        name: 'Search Promo Banners by Name',
      };
      const savedPromoBanner = await promoBannerService.create(mock);

      const promoBanners = await promoBannerService.findWithFilter(
        savedPromoBanner.name,
        null,
        null,
        null,
        INCLUDE_INACTIVE,
      );
      expect(promoBanners[0].length).toBeGreaterThan(0);
      expect(promoBanners[1]).toBeGreaterThan(0);
      promoBanners[0].forEach(promoBanner => {
        expect(promoBanner.name).toBe(savedPromoBanner.name);
      });
    });

    it('should not get inactive promo banners', async () => {
      const DONT_INCLUDE_INACTIVE = false;
      const mockActive = {
        ...new PromoBanner(),
        name: 'Active Promo Banners',
        isActive: true,
      };
      const mockInactive = {
        ...new PromoBanner(),
        name: 'Active Promo Banners',
        isActive: false,
      };
      await promoBannerService.create(mockActive);
      await promoBannerService.create(mockInactive);

      const promoBanners = await promoBannerService.findWithFilter(
        null,
        null,
        null,
        null,
        DONT_INCLUDE_INACTIVE,
      );
      expect(promoBanners[0].length).toBeGreaterThan(0);
      expect(promoBanners[1]).toBeGreaterThan(0);
      promoBanners[0].forEach(promoBanner => {
        expect(promoBanner.isActive).not.toBe(false);
      });
    });

    it('should get a promo banner', async () => {
      const mock = {
        ...new PromoBanner(),
        name: 'Get One Promo Banner',
      };
      const savedPromoBanner = await promoBannerService.create(mock);

      const promoBanner = await promoBannerService.findById(
        savedPromoBanner.id,
      );
      expect(promoBanner.name).toBe(savedPromoBanner.name);
    });

    it('should update a promo banner', async () => {
      const mock = {
        ...new PromoBanner(),
        name: 'Update Promo Banner',
      };
      const savedPromoBanner = await promoBannerService.create(mock);

      const updatedPromoBanner = {
        id: savedPromoBanner.id,
        name: 'Promo Banner has been updated',
      };

      const promoBanner = await promoBannerService.update(updatedPromoBanner);
      expect(promoBanner.name).toBe(updatedPromoBanner.name);
    });
  });
});
