import { ProductGroupFixture, ProductFixture } from '../../test/fixtures';
import { Test, TestingModule } from '@nestjs/testing';
import { def, get } from 'bdd-lazy-var';
import { sortedUniq, orderBy } from 'lodash';
import faker from 'faker';

import { AppModule } from '../app.module';
import { Brand } from '../entities/brand.entity';
import { ProductGroup } from '../entities/product-group.entity';
import { Product } from '../entities/product.entity';
import { BrandService } from '../brand/brand.service';
import { ProductController } from './product.controller';
import { ProductDto } from './dto/product.dto';
import { ProductGroupDto } from './dto/product-group.dto';
import { ProductService } from './product.service';
import { ProductGroupService } from './product-group.service';
import { FixtureService } from '../../test/utils/fixture.service';
import { TestUtilsModule } from '../../test/utils/test-utils.module';
import { ProductPricingService } from './product-pricing/product-pricing.service';
import { ProductExceptions } from './product.exceptions';
import { LocationService } from '../location/location.service';
import { ProductPricing } from '../entities/product-pricing.entity';
import { UserService } from '../user/user.service';
import { PricingType } from '../location/dto/location-search.dto';
import { UserLocationService } from '../user-location/user-location.service';
import { ProductPricingWeight } from '../entities/product-pricing-weight.entity';
import { UserLocationExceptions } from '../user-location/user-location.exceptions';

describe('Product Controller', () => {
  let productController: ProductController;
  let productService: ProductService;
  let brandService: BrandService;
  let productGroupService: ProductGroupService;
  let fixtureService: FixtureService;
  let productPricingService: ProductPricingService;
  let locationService: LocationService;
  let userService: UserService;
  let userLocationService: UserLocationService;

  let admin, siteAdmin;

  const LIMIT = 10;
  const INCLUDE_ALL_STOCK = true;
  const INCLUDE_HIDDEN = true;
  const BRAND = 'brand';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestUtilsModule],
    }).compile();
    fixtureService = module.get<FixtureService>(FixtureService);
    productController = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
    brandService = module.get<BrandService>(BrandService);
    productGroupService = module.get<ProductGroupService>(ProductGroupService);
    productPricingService = module.get<ProductPricingService>(
      ProductPricingService,
    );
    locationService = module.get<LocationService>(LocationService);
    userService = module.get<UserService>(UserService);
    userLocationService = module.get<UserLocationService>(UserLocationService);
  });

  def(BRAND, async () => {
    return fixtureService.saveEntityUsingValues(Brand);
  });

  it('should be defined', () => {
    expect(productController).toBeDefined();
    expect(productService).toBeDefined();
    expect(brandService).toBeDefined();
  });

  describe('Product Unit Tests', () => {
    beforeAll(async () => {
      admin = await userService.findByEmail('gd_admin@isbx.com');
      siteAdmin = await userService.findByEmail('user+e2e@isbx.com');
    });

    // Products
    it('should sort products by name in ascending order', async () => {
      const sort = 'name asc';
      const products: [
        ProductDto[],
        number,
      ] = await productService.findWithFilter({
        limit: LIMIT,
        order: sort,
        includeAllStock: INCLUDE_ALL_STOCK,
      });

      const expectedOrder: ProductDto[] = orderBy(
        products[0],
        (product: ProductDto) => product.name.toLowerCase(),
        'asc',
      );

      products[0].forEach((product: ProductDto, index: number) => {
        expect(product).toHaveProperty('name');
        expect(product.name).toBe(expectedOrder[index].name);
      });
    });

    it('should sort products by name in descending order', async () => {
      const sort = 'name desc';
      const products: [
        ProductDto[],
        number,
      ] = await productService.findWithFilter({
        limit: LIMIT,
        order: sort,
        includeAllStock: INCLUDE_ALL_STOCK,
      });

      const expectedOrder: ProductDto[] = orderBy(
        products[0],
        (product: ProductDto) => product.name.toLowerCase(),
        'desc',
      );

      products[0].forEach((product: ProductDto, index: number) => {
        expect(product).toHaveProperty('name');
        expect(product.name).toBe(expectedOrder[index].name);
      });
    });

    it('should sort products by price in ascending order', async () => {
      const sort = 'price asc';
      const products: [
        ProductDto[],
        number,
      ] = await productService.findWithFilter({
        limit: LIMIT,
        order: sort,
        includeAllStock: INCLUDE_ALL_STOCK,
      });

      const sortedProducts: ProductDto[] = products[0].filter(
        (product: ProductDto) => product.price,
      );

      const expectedOrder: ProductDto[] = orderBy(
        sortedProducts,
        (product: ProductDto) => Number(product.price),
        'asc',
      );

      sortedProducts.forEach((product: ProductDto, index: number) => {
        expect(product).toHaveProperty('price');
        expect(product.price).toBe(expectedOrder[index].price);
      });
    });

    it('should sort products by price in descending order', async () => {
      const sort = 'price desc';
      const products: [
        ProductDto[],
        number,
      ] = await productService.findWithFilter({
        limit: LIMIT,
        order: sort,
        includeAllStock: INCLUDE_ALL_STOCK,
      });

      const sortedProducts: ProductDto[] = products[0].filter(
        (product: ProductDto) => product.price,
      );

      const expectedOrder: ProductDto[] = orderBy(
        sortedProducts,
        (product: ProductDto) => Number(product.price),
        'desc',
      );

      sortedProducts.forEach((product: ProductDto, index: number) => {
        expect(product).toHaveProperty('price');
        expect(product.price).toBe(expectedOrder[index].price);
      });
    });

    it('should filter products by category', async () => {
      const productCategories: string[] = await productService.getProductCategories(
        null,
        null,
        INCLUDE_ALL_STOCK,
        !INCLUDE_HIDDEN,
      );
      const category: string = productCategories.find(
        _category => _category !== '',
      );

      const products: [
        ProductDto[],
        number,
      ] = await productService.findWithFilter({
        limit: LIMIT,
        includeAllStock: INCLUDE_ALL_STOCK,
        includeHidden: !INCLUDE_HIDDEN,
        category,
      });

      products[0].forEach((product: ProductDto) => {
        expect(product).toHaveProperty('category');
        expect(product.category).toBe(category);
      });
    });

    it('should not include hidden products by default', async () => {
      const products: [
        ProductDto[],
        number,
      ] = await productService.findWithFilter({
        limit: LIMIT,
        includeAllStock: INCLUDE_ALL_STOCK,
        includeHidden: !INCLUDE_HIDDEN,
      });

      products[0].forEach((product: ProductDto) => {
        expect(product.hidden).toBeFalsy();
      });
    });

    it('should return hidden products if requested', async () => {
      const products = await productService.findWithFilter({
        limit: LIMIT,
        includeAllStock: INCLUDE_ALL_STOCK,
        includeHidden: INCLUDE_HIDDEN,
      });
      expect(products[1]).toBeGreaterThan(0);
      let hiddenProductsCount = 0;
      products[0].forEach(product => {
        if (!product.hidden) hiddenProductsCount++;
      });
      expect(hiddenProductsCount).toBeGreaterThan(0);
    });

    it('should not return category that has hidden products only left.', async () => {
      const productCategories: string[] = await productService.getProductCategories(
        null,
        null,
        INCLUDE_ALL_STOCK,
        !INCLUDE_HIDDEN,
      );

      expect(productCategories.includes('Hidden Category')).toBeFalsy();
    });

    it('should limit number of products', async () => {
      const products: [
        ProductDto[],
        number,
      ] = await productService.findWithFilter({
        limit: LIMIT,
        includeAllStock: INCLUDE_ALL_STOCK,
      });

      expect(products[0].length).toBeLessThanOrEqual(LIMIT);
    });

    // Product Groups
    it('should sort productGroups by name in ascending order', async () => {
      const sort = 'name asc';
      const brandResult: [Brand[], number] = await brandService.findWithFilter(
        {},
      );
      const brandId: number = brandResult[0][0].id;
      expect(brandId).toBeTruthy();

      const productGroups: [
        ProductGroupDto[],
        number,
      ] = await productGroupService.getProductGroups({
        brandId,
        includeAllStock: true,
        order: sort,
      });

      const expectedOrder: ProductGroupDto[] = orderBy(
        productGroups[0],
        (productGroup: ProductGroupDto) => productGroup.name.toLowerCase(),
        'asc',
      );

      productGroups[0].forEach(
        (productGroup: ProductGroupDto, index: number) => {
          expect(productGroup).toHaveProperty('name');
          expect(productGroup.name).toBe(expectedOrder[index].name);
        },
      );
    });

    it('should sort productGroups by name in descending order', async () => {
      const sort = 'name desc';
      const brandResult: [Brand[], number] = await brandService.findWithFilter(
        {},
      );
      const brandId: number = brandResult[0][0].id;
      expect(brandId).toBeTruthy();

      const productGroups: [
        ProductGroupDto[],
        number,
      ] = await productGroupService.getProductGroups({
        brandId,
        includeAllStock: true,
        order: sort,
      });

      const expectedOrder: ProductGroupDto[] = orderBy(
        productGroups[0],
        (productGroup: ProductGroupDto) => productGroup.name.toLowerCase(),
        'desc',
      );

      productGroups[0].forEach(
        (productGroup: ProductGroupDto, index: number) => {
          expect(productGroup).toHaveProperty('name');
          expect(productGroup.name).toBe(expectedOrder[index].name);
        },
      );
    });

    it('should sort productGroups by the lowest price of its products in ascending order', async () => {
      const sort = 'price asc';
      const brandResult: [Brand[], number] = await brandService.findWithFilter(
        {},
      );
      const brandId: number = brandResult[0][0].id;
      expect(brandId).toBeTruthy();

      const productGroups: [
        ProductGroupDto[],
        number,
      ] = await productGroupService.getProductGroups({
        brandId,
        includeAllStock: true,
        order: sort,
      });

      const sortedProductGroups: ProductGroupDto[] = productGroups[0].filter(
        (productGroup: ProductGroupDto) => productGroup.price,
      );

      const expectedOrder: ProductGroupDto[] = orderBy(
        sortedProductGroups,
        (productGroup: ProductGroupDto) => Number(productGroup.price),
        'asc',
      );

      sortedProductGroups.forEach(
        (productGroup: ProductGroupDto, index: number) => {
          expect(productGroup).toHaveProperty('price');
          expect(productGroup.price).toBe(expectedOrder[index].price);
        },
      );
    });

    it('should sort productGroups by the lowest price of its products in descending order', async () => {
      const sort = 'price desc';
      const brandResult: [Brand[], number] = await brandService.findWithFilter(
        {},
      );
      const brandId: number = brandResult[0][0].id;
      expect(brandId).toBeTruthy();

      const productGroups: [
        ProductGroupDto[],
        number,
      ] = await productGroupService.getProductGroups({
        brandId,
        includeAllStock: true,
        order: sort,
      });

      const sortedProductGroups: ProductGroupDto[] = productGroups[0].filter(
        (productGroup: ProductGroupDto) => productGroup.price,
      );

      const expectedOrder: ProductGroupDto[] = orderBy(
        sortedProductGroups,
        (productGroup: ProductGroupDto) => Number(productGroup.price),
        'desc',
      );

      sortedProductGroups.forEach(
        (productGroup: ProductGroupDto, index: number) => {
          expect(productGroup).toHaveProperty('price');
          expect(productGroup.price).toBe(expectedOrder[index].price);
        },
      );
    });

    it('should filter productGroups by category', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      let newProductGroup = new ProductGroupFixture() as ProductGroup;
      newProductGroup = {
        ...newProductGroup,
        brand,
        category: 'Sample Category',
      };
      await productGroupService.create(newProductGroup);
      expect(newProductGroup).toBeTruthy();

      let product = new ProductFixture() as Product;
      product = {
        ...product,
        category: 'Sample Category',
        productGroup: newProductGroup,
      };
      await productService.create(product);
      expect(product).toBeTruthy();

      const productGroupCategories: string[] = await productService.getProductCategories(
        null,
        brand.id,
        INCLUDE_ALL_STOCK,
      );

      const category: string = productGroupCategories[0];
      expect(category).toBeTruthy();

      const productGroups: [
        ProductGroupDto[],
        number,
      ] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeAllStock: true,
        category,
      });

      productGroups[0].forEach((productGroup: ProductGroupDto) => {
        expect(productGroup).toHaveProperty('category');
        expect(productGroup.category).toBe(category);
      });
    });

    it('should match categories of retrieved productGroups of a brand', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      let newProductGroup = new ProductGroupFixture() as ProductGroup;
      newProductGroup = {
        ...newProductGroup,
        brand,
        category: 'Sample Category',
      };
      await productGroupService.create(newProductGroup);
      expect(newProductGroup).toBeTruthy();

      let product = new ProductFixture() as Product;
      product = {
        ...product,
        category: 'Sample Category',
        productGroup: newProductGroup,
      };
      await productService.create(product);
      expect(product).toBeTruthy();

      const productGroupCategories: string[] = await productService.getProductCategories(
        null,
        brand.id,
        INCLUDE_ALL_STOCK,
      );
      expect(productGroupCategories[0]).toBeTruthy();

      const productGroups: [
        ProductGroupDto[],
        number,
      ] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeAllStock: true,
      });
      expect(productGroups[0]).toBeTruthy();
      productGroups[0].forEach((productGroup: ProductGroupDto) => {
        expect(productGroup).toHaveProperty('category');
      });

      const mappedCategories = sortedUniq(
        orderBy(
          productGroups[0].map(data => data.category),
          category => category.toLowerCase(),
        ),
      );
      expect(mappedCategories.length).toBe(productGroupCategories.length);
      mappedCategories.forEach((category, index) => {
        expect(category).toBe(productGroupCategories[index]);
      });
    });

    it('should match categories of retrieved productGroups of a brand (available stocks)', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      let newProductGroup = new ProductGroupFixture() as ProductGroup;
      newProductGroup = {
        ...newProductGroup,
        brand,
        category: 'Sample Category',
      };
      await productGroupService.create(newProductGroup);
      expect(newProductGroup).toBeTruthy();

      let outOfStockProduct = new ProductFixture() as Product;
      outOfStockProduct = {
        ...outOfStockProduct,
        category: 'Sample Category',
        productGroup: newProductGroup,
        isInStock: false,
      };
      await productService.create(outOfStockProduct);
      expect(outOfStockProduct).toBeTruthy();

      let inStockProduct = new ProductFixture() as Product;
      inStockProduct = {
        ...inStockProduct,
        category: 'Sample Category',
        productGroup: newProductGroup,
      };
      await productService.create(inStockProduct);
      expect(inStockProduct).toBeTruthy();

      const productGroupCategories: string[] = await productService.getProductCategories(
        null,
        brand.id,
        !INCLUDE_ALL_STOCK,
      );
      expect(productGroupCategories[0]).toBeTruthy();

      const productGroups: [
        ProductGroupDto[],
        number,
      ] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeAllStock: false,
      });
      expect(productGroups[0]).toBeTruthy();
      productGroups[0].forEach((productGroup: ProductGroupDto) => {
        expect(productGroup).toHaveProperty('category');
      });

      const mappedCategories = sortedUniq(
        orderBy(
          productGroups[0].map(productGroup => productGroup.category),
          category => category.toLowerCase(),
        ),
      );
      expect(mappedCategories.length).toBe(productGroupCategories.length);
      mappedCategories.forEach((category, index) => {
        expect(category).toBe(productGroupCategories[index]);
      });
    });

    it('should sort categories alphabetically', async () => {
      const categories: string[] = await productService.getProductCategories();
      const expectedOrder = orderBy(categories, category =>
        category.toLowerCase(),
      );

      expect(categories[0]).toBeDefined();
      categories.forEach((category, index) => {
        expect(category).toBe(expectedOrder[index]);
      });
    });

    it('Should be able to upsert pricing (user as admin)', async () => {
      const locations = await locationService.findWithFilter({
        search: 'NextGen Dispensary',
      });
      const location = locations[0][0];

      const newProduct = await fixtureService.saveEntityUsingValues(Product, {
        location: { id: location.id },
        pricingType: PricingType.Unit,
      });
      expect(newProduct).toBeTruthy();

      const newProductPricing = {
        product: { id: newProduct.id },
        price: parseFloat(faker.commerce.price()),
      } as ProductPricing;

      const result = await productPricingService.upsertPricing(
        newProductPricing,
        admin,
      );
      expect(result).toBeTruthy();
    });

    it('Should be able to upsert weight prices (user as admin)', async () => {
      const locations = await locationService.findWithFilter({
        search: 'NextGen Dispensary',
      });
      const location = locations[0][0];

      // Create product and pricing
      const newProduct = await fixtureService.saveEntityUsingValues(Product, {
        location: { id: location.id },
      });
      expect(newProduct).toBeTruthy();

      const weightPrices = [
        { name: '1/4oz', price: parseFloat(faker.commerce.price()) },
        { name: '3/4oz', price: parseFloat(faker.commerce.price()) },
      ] as ProductPricingWeight[];
      await productPricingService.upsertPricingWeights(
        newProduct.id,
        weightPrices,
        admin,
      );
    });

    it('Should be able to upsert pricing (user as site admin)', async () => {
      const assignedLocations = await userLocationService.getAllByUserId(
        siteAdmin.id,
      );
      expect((assignedLocations || []).length).toBeGreaterThan(0);

      const location = assignedLocations[0].location;

      const newProduct = await fixtureService.saveEntityUsingValues(Product, {
        location: { id: location.id },
        pricingType: PricingType.Unit,
      });
      expect(newProduct).toBeTruthy();

      const newProductPricing = {
        product: { id: newProduct.id },
        price: parseFloat(faker.commerce.price()),
      } as ProductPricing;

      const result = await productPricingService.upsertPricing(
        newProductPricing,
        siteAdmin,
      );
      expect(result).toBeTruthy();
    });

    it('Should be able to upsert weight prices (user as site admin)', async () => {
      const assignedLocations = await userLocationService.getAllByUserId(
        siteAdmin.id,
      );
      expect((assignedLocations || []).length).toBeGreaterThan(0);

      const location = assignedLocations[0].location;
      // Create product and pricing
      const newProduct = await fixtureService.saveEntityUsingValues(Product, {
        location: { id: location.id },
      });
      expect(newProduct).toBeTruthy();

      const weightPrices = [
        { name: '1/4oz', price: parseFloat(faker.commerce.price()) },
        { name: '3/4oz', price: parseFloat(faker.commerce.price()) },
      ] as ProductPricingWeight[];

      await productPricingService.upsertPricingWeights(
        newProduct.id,
        weightPrices,
        siteAdmin,
      );
    });

    it('Should be able to upsert pricing for hidden products', async () => {
      const locations = await locationService.findWithFilter({
        search: 'NextGen Dispensary',
      });
      const location = locations[0][0];

      const newProduct = await fixtureService.saveEntityUsingValues(Product, {
        location: { id: location.id },
        pricingType: PricingType.Unit,
        hidden: true,
      });
      expect(newProduct).toBeTruthy();

      const newProductPricing = {
        product: { id: newProduct.id },
        price: parseFloat(faker.commerce.price()),
      } as ProductPricing;

      const result = await productPricingService.upsertPricing(
        newProductPricing,
        admin,
      );
      expect(result).toBeTruthy();
    });

    it('Should be able to upsert weight prices for hidden products', async () => {
      const locations = await locationService.findWithFilter({
        search: 'NextGen Dispensary',
      });
      const location = locations[0][0];

      // Create hidden product and pricing
      const newProduct = await fixtureService.saveEntityUsingValues(Product, {
        location: { id: location.id },
        hidden: true,
      });
      expect(newProduct).toBeTruthy();

      const weightPrices = [
        { name: '1/4oz', price: parseFloat(faker.commerce.price()) },
        { name: '3/4oz', price: parseFloat(faker.commerce.price()) },
      ] as ProductPricingWeight[];
      await productPricingService.upsertPricingWeights(
        newProduct.id,
        weightPrices,
        admin,
      );
    });

    // TODO
    // it('should find products by location', async () => {});
    // it('should search products by name', async () => {});
    // it('should include all stock of products', async () => {});
    // it('should include all stock of products in productGroups', async () => {});
    // it('should include deleted products', async () => {});
    // it('should include deleted productGroups', async () => {});
    // it('should find products by product group', async () => {});
    // it('should find products by brand', async () => {});
  });

  describe('Expected Exceptions', () => {
    it('Should not upsert pricing if product not exist', async () => {
      const NOT_EXIST_PRODUCT_ID = 3132;

      const newProductPricing = {
        product: { id: NOT_EXIST_PRODUCT_ID },
        price: parseFloat(faker.commerce.price()),
      } as ProductPricing;

      const { productNotFound: EXPECTED } = ProductExceptions;
      try {
        await productPricingService.upsertPricing(newProductPricing, admin);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('Should not upsert weight prices if product not exist', async () => {
      const NOT_EXIST_PRODUCT_ID = 3132;

      const weightPrices = [
        { name: '1/4oz', price: parseFloat(faker.commerce.price()) },
        { name: '3/4oz', price: parseFloat(faker.commerce.price()) },
      ] as ProductPricingWeight[];

      const { productNotFound: EXPECTED } = ProductExceptions;
      try {
        await productPricingService.upsertPricingWeights(
          NOT_EXIST_PRODUCT_ID,
          weightPrices,
          admin,
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it(`Should not upsert pricing if user (site admin) not assign to product's location`, async () => {
      const assignedLocations = await userLocationService.getAllByUserId(
        siteAdmin.id,
      );
      expect((assignedLocations || []).length).toBeGreaterThan(0);

      const [locations] = await locationService.findWithFilter({
        search: 'Cannacity Shop',
      });
      expect((locations || []).length).toBeGreaterThan(0);

      const notAssignLocation = locations[0];

      // Check if location is assigned to the user
      const isFound = !!assignedLocations.find(
        assignedLocation =>
          assignedLocation.location &&
          assignedLocation.location.id === notAssignLocation.id,
      );
      expect(isFound).toBeFalsy();

      const newProduct = await fixtureService.saveEntityUsingValues(Product, {
        location: { id: notAssignLocation.id },
        pricingType: PricingType.Unit,
      });
      expect(newProduct).toBeTruthy();

      const newProductPricing = {
        product: { id: newProduct.id },
        price: parseFloat(faker.commerce.price()),
      } as ProductPricing;

      const { notAssignedToLocation: EXPECTED } = UserLocationExceptions;
      try {
        await productPricingService.upsertPricing(newProductPricing, siteAdmin);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it(`Should not upsert weight prices if user (site admin) not assign to product's location`, async () => {
      const assignedLocations = await userLocationService.getAllByUserId(
        siteAdmin.id,
      );
      expect((assignedLocations || []).length).toBeGreaterThan(0);

      const [locations] = await locationService.findWithFilter({
        search: 'Cannacity Shop',
      });
      expect((locations || []).length).toBeGreaterThan(0);

      const notAssignLocation = locations[0];

      // Check if location is assigned to the user
      const isFound = !!assignedLocations.find(
        assignedLocation =>
          assignedLocation.location &&
          assignedLocation.location.id === notAssignLocation.id,
      );
      expect(isFound).toBeFalsy();

      // Create product and pricing
      const newProduct = await fixtureService.saveEntityUsingValues(Product, {
        location: { id: notAssignLocation.id },
      });
      expect(newProduct).toBeTruthy();

      const weightPrices = [
        { name: '1/4oz', price: parseFloat(faker.commerce.price()) },
        { name: '3/4oz', price: parseFloat(faker.commerce.price()) },
      ] as ProductPricingWeight[];

      const { notAssignedToLocation: EXPECTED } = UserLocationExceptions;
      try {
        await productPricingService.upsertPricingWeights(
          newProduct.id,
          weightPrices,
          siteAdmin,
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });
  });
});
