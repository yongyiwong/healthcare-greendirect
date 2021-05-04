import { Test } from '@nestjs/testing';

import { AppModule } from '../app.module';
import { SiteMapController } from './site-map.controller';
import { SiteMapService } from './site-map.service';

/**
 * npx jest -t "SiteMap_Specs"
 */
describe('SiteMap_Specs', () => {
  let siteMapController: SiteMapController;
  let siteMapService: SiteMapService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      providers: [SiteMapService],
    }).compile();

    siteMapController = module.get<SiteMapController>(SiteMapController);
    siteMapService = module.get<SiteMapService>(SiteMapService);
  });

  it('should be defined', () => {
    expect(siteMapController).toBeDefined();
    expect(siteMapService).toBeDefined();
  });

  describe('URL Array Composition', async () => {
    it('should retrieve static URLs', async () => {
      const xml = await siteMapService.getSitemap('default');
      expect(xml).toBeTruthy();
    });

    it('should retrieve location URLS', async () => {
      const xml = await siteMapService.getSitemap('locations');
      expect(xml).toBeTruthy();
    });

    it('should retrieve product URLS', async () => {
      const xml = await siteMapService.getSitemap('products');
      expect(xml).toBeTruthy();
    });

    it('should retrieve brand URLS', async () => {
      const xml = await siteMapService.getSitemap('brands');
      expect(xml).toBeTruthy();
    });

    it('should retrieve product-sku URLS', async () => {
      const xml = await siteMapService.getSitemap('productSkus');
      expect(xml).toBeTruthy();
    });

    it('should retrieve brand-product URLS', async () => {
      const xml = await siteMapService.getSitemap('brandProducts');
      expect(xml).toBeTruthy();
    });

    it('should retrieve deal URLS', async () => {
      const xml = await siteMapService.getSitemap('deals');
      expect(xml).toBeTruthy();
    });

    it('should retrieve doctor URLS', async () => {
      const xml = await siteMapService.getSitemap('doctors');
      expect(xml).toBeTruthy();
    });
  });

  describe('Index XML Composition', async () => {
    it('should compose the main xml stream', async () => {
      const index = await siteMapService.getSitemapIndex();
      expect(index).toBeDefined();
    });
  });
});
