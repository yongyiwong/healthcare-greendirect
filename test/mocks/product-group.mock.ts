import { TestingModule } from '@nestjs/testing';
import { getRepository, Repository } from 'typeorm';
import faker from 'faker';
import { range } from 'lodash';

import { FixtureService } from '../utils/fixture.service';
import { Product } from '../../src/entities/product.entity';
import { ProductGroup } from '../../src/entities/product-group.entity';
import { BrandService } from '../../src/brand/brand.service';
import { LocationService } from '../../src/location/location.service';
import { Location } from '../../src/entities/location.entity';
import { ProductService } from '../../src/product/product.service';

export class ProductGroupMock {
  private brandService: BrandService;
  private locationService: LocationService;
  private fixtureService: FixtureService;

  constructor(private readonly module: TestingModule) {
    this.brandService = this.module.get<BrandService>(BrandService);
    this.locationService = this.module.get<LocationService>(LocationService);
    this.fixtureService = this.module.get<FixtureService>(FixtureService);
  }

  async generate() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000; // 200 seconds
    await this.setupProductGroup();
  }

  async createProductGroups(): Promise<ProductGroup[]> {
    const brands = await this.brandService.findWithFilter({});

    const productGroupPromises = [];
    brands[0].forEach(brand => {
      range(0, 4).forEach(() =>
        productGroupPromises.push(
          this.fixtureService.saveEntityUsingValues(ProductGroup, {
            brand,
          }),
        ),
      );
    });

    // Product groups with no brand selected
    const noBrands = range(0, 4).map(() =>
      this.fixtureService.saveEntityUsingValues(ProductGroup, {
        name: 'NOBRAND-' + faker.commerce.productName(),
      }),
    );

    return Promise.all([...productGroupPromises, ...noBrands]);
  }

  async setupProductGroup() {
    const productGroups = await this.createProductGroups();
    const locations = await this.locationService.findWithFilter({});

    const productPromises = [];
    locations[0].forEach(location => {
      productGroups.forEach(productGroup => {
        // Skip product group with no brand
        if (!productGroup.brand) return;

        range(0, 4).forEach(index => {
          productPromises.push(
            this.fixtureService.saveEntityUsingValues(Product, {
              name: productGroup.name,
              category: productGroup.category,
              location: { id: location.id } as Location,
              productGroup: { id: productGroup.id } as ProductGroup,
              deleted: index === 0, // mark the first product as a deleted one, as a sample
            }),
          );
        });
      });
    });
    await Promise.all(productPromises);
  }
}
