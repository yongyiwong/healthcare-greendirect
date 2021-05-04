import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentMetadata } from '@nestjs/common';
import faker from 'faker';

import { TestUtilsModule } from '../../test/utils/test-utils.module';
import { AppModule } from '../app.module';
import { SearchService } from './search.service';
import {
  SearchFilter,
  OTHER_CATEGORY,
  NO_CATEGORY,
} from '../common/search-count.dto';
import { ProductService } from '../product/product.service';
import { LocationService } from '../location';
import { BrandService } from '../brand/brand.service';
import { DealService } from '../deal/deal.service';
import { DoctorService } from '../doctor/doctor.service';
import { OrganizationService } from '../organization/organization.service';
import { Product } from '../entities/product.entity';
import { PricingType } from '../location/dto/location-search.dto';
import { Location } from '../entities/location.entity';
import { SearchScrubberPipe } from '../common/pipes/search-scrubber.pipe';
import { Deal } from '../entities/deal.entity';
import { LocationDeal } from '../entities/location-deal.entity';

describe('SearchSpec', () => {
  let searchService: SearchService;
  let productService: ProductService;
  let locationService: LocationService;
  let brandService: BrandService;
  let dealService: DealService;
  let doctorService: DoctorService;
  let organizationService: OrganizationService;

  const generalSearchString = 'a';
  const locationSearchString = 'SearchData Location';
  const productSearchString = 'SearchData Product';
  const dealSearchString = 'SearchData Deal';
  const uniqueString = `Nonexistent Data`;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestUtilsModule],
    }).compile();

    searchService = module.get<SearchService>(SearchService);
    productService = module.get<ProductService>(ProductService);
    locationService = module.get<LocationService>(LocationService);
    brandService = module.get<BrandService>(BrandService);
    dealService = module.get<DealService>(DealService);
    doctorService = module.get<DoctorService>(DoctorService);
    organizationService = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(searchService).toBeDefined();
  });

  describe('Search Service Unit Tests', () => {
    beforeAll(async () => {
      const [[organization]] = await organizationService.findWithFilter({
        search: 'ISBX',
      });

      const location = {
        ...new Location(),
        name: locationSearchString,
        organization,
      };
      await locationService.create(location as Location);

      const product = {
        ...new Product(),
        name: productSearchString,
        category: faker.commerce.productMaterial(),
        location,
      };

      await productService.create(product);

      const deal = {
        ...new Deal(),
        title: dealSearchString,
        category: faker.random.number(8),
        dealLocations: [{ ...new LocationDeal(), location }],
      };

      await dealService.createDeal(deal);
    });

    it('should get count of all active products and count per category', async () => {
      const searchCount = await productService.getSearchCount({
        search: productSearchString,
      });
      const [[product], productsCount] = await productService.findWithFilter({
        search: productSearchString,
      });
      expect(searchCount).toBeTruthy();
      expect(searchCount.count).toBeGreaterThan(0);
      expect(searchCount.count).toEqual(productsCount);

      const category = product.category;
      // Filtered by search string and category
      const categorizedSearchCount = await productService.getSearchCount({
        search: productSearchString,
        category,
      });
      const categorizedProducts = await productService.findWithFilter({
        search: productSearchString,
        category,
      });
      expect(categorizedSearchCount).toBeTruthy();
      expect(categorizedSearchCount.count).toBeGreaterThan(0);
      expect(categorizedSearchCount.count).toEqual(categorizedProducts[1]);
    });

    it('should not have null or empty category in products', async () => {
      const otherCategory = 'SearchData Product - Other Category';
      const [[location]] = await locationService.findWithFilter({
        search: 'SearchData Location',
      });
      const product = {
        pricingType: PricingType.Unit,
        pricing: {
          price: parseFloat(faker.commerce.price()),
        },
        location,
      } as Product;
      await Promise.all([
        productService.create({
          ...product,
          name: otherCategory,
          category: OTHER_CATEGORY.toUpperCase(),
        }),
        productService.create({
          ...product,
          name: otherCategory,
          category: OTHER_CATEGORY,
        }),
        productService.create({
          ...product,
          name: 'SearchData Product - No Category',
          category: NO_CATEGORY,
        }),
      ]);

      // 'Other' with no_category
      const searchCount = await productService.getSearchCount({
        search: 'SearchData Product',
      });

      const [_, otherCategoryCount] = await productService.findWithFilter({
        search: 'SearchData Product',
        category: OTHER_CATEGORY,
      });

      searchCount.categories.map(category => {
        expect(category).not.toHaveProperty(NO_CATEGORY);

        if (category[OTHER_CATEGORY]) {
          expect(category[OTHER_CATEGORY]).toBeGreaterThanOrEqual(
            otherCategoryCount,
          );
        }
      });

      // 'Other' category data only
      const { categories } = await productService.getSearchCount({
        search: otherCategory,
      });
      expect(categories[0][OTHER_CATEGORY]).toBeGreaterThan(0);
    });

    it('should get count of all active locations', async () => {
      // Filtered by search string
      const filteredSearchCount = await locationService.getSearchCount({
        search: locationSearchString,
      });
      const [_, filteredLocationsCount] = await locationService.findWithFilter({
        search: locationSearchString,
      });
      expect(filteredSearchCount).toBeTruthy();
      expect(filteredSearchCount.count).toBeGreaterThan(0);
      expect(filteredSearchCount.count).toEqual(filteredLocationsCount);
    });

    it('should get count of all active brands', async () => {
      // Filtered by search string
      const filteredSearchCount = await brandService.getSearchCount({
        search: generalSearchString,
      });
      const [_, filteredBrandsCount] = await brandService.findWithFilter({
        search: generalSearchString,
      });
      expect(filteredSearchCount).toBeTruthy();
      expect(filteredSearchCount.count).toBeGreaterThan(0);
      expect(filteredSearchCount.count).toEqual(filteredBrandsCount);
    });

    it('should get count of all active deals and count per category', async () => {
      const searchCount = await dealService.getSearchCount({
        search: dealSearchString,
      });
      const [[deal], dealsCount] = await dealService.findWithFilter({
        search: dealSearchString,
      });
      expect(searchCount).toBeTruthy();
      expect(searchCount.count).toBeGreaterThan(0);
      expect(searchCount.count).toEqual(dealsCount);

      const category = deal.category;
      // Filtered by search string and category
      const categorizedSearchCount = await dealService.getSearchCount({
        search: dealSearchString,
        category,
      });
      const categorizedDeals = await dealService.findWithFilter({
        search: dealSearchString,
        category,
      });
      expect(categorizedSearchCount).toBeTruthy();
      expect(categorizedSearchCount.count).toBeGreaterThan(0);
      expect(categorizedSearchCount.count).toEqual(categorizedDeals[1]);
    });

    it('should get count of all active doctors', async () => {
      // Filtered by search string
      const filteredSearchCount = await doctorService.getSearchCount({
        search: generalSearchString,
      });
      const [_, filteredDoctorsCount] = await doctorService.findWithFilter({
        search: generalSearchString,
      });
      expect(filteredSearchCount).toBeTruthy();
      expect(filteredSearchCount.count).toBeGreaterThan(0);
      expect(filteredSearchCount.count).toEqual(filteredDoctorsCount);
    });

    it('should return 0 count when no data searched in products', async () => {
      const { count } = await productService.getSearchCount({
        search: uniqueString,
      });

      expect(count).toEqual(0);
    });

    it('should return 0 count when no data searched in shops', async () => {
      const { count } = await locationService.getSearchCount({
        search: uniqueString,
      });

      expect(count).toEqual(0);
    });

    it('should return 0 count when no data searched in brands', async () => {
      const { count } = await brandService.getSearchCount({
        search: uniqueString,
      });

      expect(count).toEqual(0);
    });

    it('should return 0 count when no data searched in deals', async () => {
      const { count } = await dealService.getSearchCount({
        search: uniqueString,
      });

      expect(count).toEqual(0);
    });

    it('should return 0 count when no data searched in doctors', async () => {
      const { count } = await doctorService.getSearchCount({
        search: uniqueString,
      });

      expect(count).toEqual(0);
    });

    it('should not include products with deleted location in web search', async () => {
      const [[location]] = await locationService.findWithFilter({
        search: 'SearchData Location',
      });
      const [products, productsCount] = await productService.findWithFilter({
        search: productSearchString,
        paginated: true,
      });
      expect(products).toBeTruthy();
      expect(productsCount).toBeGreaterThan(0);

      await locationService.remove(location.id, location.createdBy);
      const [_, nonExistingProductsCount] = await productService.findWithFilter(
        {
          search: productSearchString,
          paginated: true,
        },
      );
      // revert deletion of location
      await locationService.update({
        id: location.id,
        deleted: false,
      } as Location);
    });

    it('should properly escape % and _ on search string', async () => {
      const searchStrings = ['%', '_']; // POSTGRESQL wildcard characters

      const searchScrubberPipe = new SearchScrubberPipe();
      const scrubbedSearchStrings = searchStrings.map(str =>
        searchScrubberPipe.transform(str, {} as ArgumentMetadata),
      );

      const result = await Promise.all(
        scrubbedSearchStrings.map(str =>
          searchService.getSearchCount({ search: str }),
        ),
      );

      const productSearchResults = await Promise.all(
        scrubbedSearchStrings.map(str =>
          productService.findWithFilter({ search: str }),
        ),
      );

      const shopSearchResults = await Promise.all(
        scrubbedSearchStrings.map(str =>
          locationService.findWithFilter({ search: str }),
        ),
      );

      const dealSearchResults = await Promise.all(
        scrubbedSearchStrings.map(str =>
          dealService.findWithFilter({ search: str }),
        ),
      );

      const brandSearchResults = await Promise.all(
        scrubbedSearchStrings.map(str =>
          brandService.findWithFilter({ search: str }),
        ),
      );

      const doctorSearchResults = await Promise.all(
        scrubbedSearchStrings.map(str =>
          doctorService.findWithFilter({ search: str }),
        ),
      );

      result.forEach((res, i) => {
        expect(res).toBeTruthy();
        expect(res.products.count).toEqual(productSearchResults[i][1]);
        expect(res.shops.count).toEqual(shopSearchResults[i][1]);
        expect(res.deals.count).toEqual(dealSearchResults[i][1]);
        expect(res.brands.count).toEqual(brandSearchResults[i][1]);
        expect(res.doctors.count).toEqual(doctorSearchResults[i][1]);
      });
    });
  });
});
