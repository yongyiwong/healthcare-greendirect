import { BrandFixture } from '../../test/fixtures';
import faker from 'faker';
import { def, get } from 'bdd-lazy-var';
import { Test } from '@nestjs/testing';

import { AppModule } from '../app.module';
import { BrandService } from './brand.service';
import { UserService } from '../user/user.service';
import { Brand } from '../entities/brand.entity';
import { BrandExceptions } from './brand.exceptions';
import { FixtureService } from '../../test/utils/fixture.service';
import { TestUtilsModule } from '../../test/utils/test-utils.module';
import { ProductService } from '../product/product.service';
import { ProductGroup } from '../entities/product-group.entity';
import { Product } from '../entities/product.entity';
import { ProductGroupService } from '../product/product-group.service';

describe('BrandController', () => {
  let brandService: BrandService;
  let userService: UserService;
  let fixtureService: FixtureService;
  let productService: ProductService;
  let productGroupService: ProductGroupService;
  let admin;

  const INCLUDE_ALL_STOCK = true;
  const INCLUDE_DELETED = true;
  const INCLUDE_HIDDEN = true;

  const BRAND = 'brand';
  const PRODUCT_GROUP = 'product_group';
  const PRODUCT = 'product';
  const TEST_DATE = new Date();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, TestUtilsModule],
    }).compile();

    fixtureService = module.get<FixtureService>(FixtureService);
    brandService = module.get<BrandService>(BrandService);
    userService = module.get<UserService>(UserService);
    productService = module.get<ProductService>(ProductService);
    productGroupService = module.get<ProductGroupService>(ProductGroupService);

    // Admin Role
    admin = await userService.findByEmail('admin_e2e@isbx.com');
  });

  def(BRAND, async () => {
    return fixtureService.saveEntityUsingValues(Brand);
  });

  describe('Brand Unit Tests', () => {
    def(PRODUCT_GROUP, async () => {
      const brand = await get(BRAND);
      return fixtureService.saveEntityUsingValues(ProductGroup, {
        brand,
      });
    });

    def(PRODUCT, async () => {
      await get(BRAND);
      const productGroup = await get(PRODUCT_GROUP);
      return fixtureService.saveEntityUsingValues(Product, {
        deleted: false,
        isInStock: true,
        productGroup,
      });
    });

    it('should get all brands', async () => {
      const result = await brandService.findWithFilter({});
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toBeInstanceOf(Array);
      expect(result[0].length).toBeGreaterThan(0);
    });

    it('should get all brands including deleted', async () => {
      const [brands] = await brandService.findWithFilter({});
      expect(brands).toBeInstanceOf(Array);
      expect(brands.length).toBeGreaterThan(0);

      const deletedBrand = brands[0];
      await brandService.removeBrand(deletedBrand.id, admin.id);

      const result = await brandService.findWithFilter({
        includeDeleted: INCLUDE_DELETED,
      });

      const deletedBrands = result[0].filter(brand => brand.deleted);
      expect(deletedBrands.length).toBeGreaterThan(0);
    });

    it('should create brand', async () => {
      const brand = new BrandFixture() as Brand;
      const result = await brandService.createBrand(brand);
      expect(result.id).toBeTruthy();
    });

    it('should get brand by id', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const result = await brandService.findById(brand.id, false);
      expect(result.id).toBe(brand.id);
    });

    it('should update brand', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const ts = +new Date(); // force milliseconds
      const updatedBrand = brand;
      updatedBrand.name = `Brands${ts}`; // update value

      const result = await brandService.updateBrand(updatedBrand);
      expect(result.id).toBe(brand.id);
      expect(result.name).toBe(updatedBrand.name);
    });

    it('should get all product groups by brand id', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const productGroup = await get(PRODUCT_GROUP);
      expect(productGroup).toBeTruthy();

      const result = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: false,
        includeAllStock: true,
      });

      expect(result[0]).toBeInstanceOf(Array);
      expect(result[0].length).toBeGreaterThan(0);

      for (const productGroupItem of result[0]) {
        expect(productGroupItem.brand.id).toBe(brand.id);
      }
    });

    it('should get all product groups by brand id including deleted', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const data = new ProductGroup();
      data.brand = { id: brand.id } as Brand;
      data.name = `CREATE-${faker.commerce.productName()} ${TEST_DATE.getTime()} PRODUCT GROUP`;

      const createdProductGroup = await productGroupService.create(data);
      expect(createdProductGroup).toBeTruthy();
      expect(createdProductGroup);

      await productGroupService.remove(createdProductGroup.id, admin.id);

      const result = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: true,
        includeAllStock: true,
      });

      expect(result[0]).toBeInstanceOf(Array);
      expect(result[0].length).toBeGreaterThan(0);

      const deletedProductGroups = result[0].filter(
        productGroup => productGroup.deleted,
      );
      expect(deletedProductGroups.length).toBeGreaterThan(0);
    });

    it('should not get product group if no products under product group', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const productGroup = await get(PRODUCT_GROUP);
      expect(productGroup).toBeTruthy();

      const result = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: false,
        includeAllStock: false,
      });

      expect(result[0]).toBeInstanceOf(Array);
      expect(result[0].length).toBe(0);
    });

    it('should not get product group if products under product group is deleted', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const productGroup = await get(PRODUCT_GROUP);
      expect(productGroup).toBeTruthy();

      const product = await get(PRODUCT); // creates product with created product group as parent
      expect(product).toBeTruthy();

      const [initialCheck] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: false,
        includeAllStock: false,
      });
      const initialResultCount = initialCheck.length;
      expect(initialCheck).toBeInstanceOf(Array);
      expect(initialResultCount).toBeGreaterThan(0); // check if existing due to product not deleted

      await productService.remove(product.id, admin.id); // delete product

      const [result] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: false,
        includeAllStock: false,
      });
      const updatedResultCount = result.length;

      expect(result).toBeInstanceOf(Array);
      expect(updatedResultCount).toBeLessThan(initialResultCount); // check if now unavailable due to deletion
    });

    it('should not get product group if products under product group is out of stock', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const productGroup = await get(PRODUCT_GROUP);
      expect(productGroup).toBeTruthy();

      const product = await get(PRODUCT); // creates product with created product group as parent
      expect(product).toBeTruthy();

      const [initialCheck] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: false,
        includeAllStock: false,
      });
      const initialResultCount = initialCheck.length;

      expect(initialCheck).toBeInstanceOf(Array);
      expect(initialResultCount).toBeGreaterThan(0); // check if existing due to product in stock

      await productService.update({
        ...product,
        isInStock: false,
      });

      const [result] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: false,
        includeAllStock: false,
      });
      const updatedResultCount = result.length;

      expect(result).toBeInstanceOf(Array);
      expect(updatedResultCount).toBeLessThan(initialResultCount); // check if now unavailable due to out of stock
    });

    it('should not get products under product group if hidden', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const productGroup = await get(PRODUCT_GROUP);
      expect(productGroup).toBeTruthy();

      const product = await get(PRODUCT); // creates product with created product group as parent
      expect(product).toBeTruthy();

      const [initialCheck] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: false,
        includeAllStock: false,
      });
      const initialResultCount = initialCheck.length;

      expect(initialCheck).toBeInstanceOf(Array);
      expect(initialResultCount).toBeGreaterThan(0);

      await productService.update({
        ...product,
        hidden: true,
      });

      const [result] = await productGroupService.getProductGroups({
        brandId: brand.id,
        includeDeleted: false,
        includeAllStock: false,
      });
      const updatedResultCount = result.length;

      expect(result).toBeInstanceOf(Array);
      expect(updatedResultCount).toBeLessThan(initialResultCount); // check if now unavailable due to hidden
    });

    it('should get products using brand id and product group id', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const productGroup = await get(PRODUCT_GROUP);
      expect(productGroup).toBeTruthy();

      const products = await get(PRODUCT);
      expect(products).toBeTruthy();

      const result = await productService.findWithFilter({
        includeAllStock: INCLUDE_ALL_STOCK,
        includeDeleted: !INCLUDE_DELETED,
        includeHidden: INCLUDE_HIDDEN,
        productGroupId: productGroup.id,
        brandId: brand.id,
      });
      expect(result[0]).toBeInstanceOf(Array);
      expect(result[0].length).toBeGreaterThan(0);
      for (const product of result[0]) {
        expect(product.productGroup.id).toBe(productGroup.id);
      }
    });

    it('should get all locations by brand id', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const productGroup = await get(PRODUCT_GROUP);
      expect(productGroup).toBeTruthy();

      const products = await get(PRODUCT);
      expect(products).toBeTruthy();

      const result = await brandService.getBrandLocations(brand.id);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should not get locations by brand id if brand is deleted', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const productGroup = await get(PRODUCT_GROUP); // creates product group with created brand as parent
      expect(productGroup).toBeTruthy();

      const products = await get(PRODUCT); // creates product with created product group as parent
      expect(products).toBeTruthy();

      await brandService.removeBrand(brand.id, admin.id);

      const deletedBrand = await brandService.findById(brand.id, true);
      expect(deletedBrand.deleted).toBeTruthy(); // check if deleted

      const result = await brandService.getBrandLocations(brand.id);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should delete brand', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();
      expect(brand.deleted).toBe(false);

      let result = await brandService.findById(brand.id, false);
      expect(brand).toBeTruthy();

      await brandService.removeBrand(brand.id, admin.id);

      result = await brandService.findById(brand.id, true);
      expect(result.deleted).toBeTruthy();
    });
  });

  describe('Expected Exceptions', () => {
    it('Should not return data if soft deleted', async () => {
      const { brandNotFound: EXPECTED } = BrandExceptions;
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();
      expect(brand.deleted).toBe(false);

      const brandChecker = await brandService.findById(brand.id, false);
      expect(brandChecker).toBeTruthy();

      await brandService.removeBrand(brand.id, admin.id);
      try {
        await brandService.findById(brand.id, false); // hard-coded id
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('Should not return data if not exist', async () => {
      const { brandNotFound: EXPECTED } = BrandExceptions;
      try {
        await brandService.findById(0); // hard-coded id
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });
  });
});
