import faker from 'faker';
import { Test } from '@nestjs/testing';
import { def, get } from 'bdd-lazy-var';
import _ from 'lodash';

import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { Brand } from './../entities/brand.entity';
import { FixtureService } from '../../test/utils/fixture.service';
import { TestUtilsModule } from '../../test/utils/test-utils.module';
import { ProductGroup } from '../entities/product-group.entity';
import { ProductGroupService } from './product-group.service';
import { ProductService } from './product.service';
import { ProductExceptions } from './product.exceptions';
import { Product } from '../entities/product.entity';

describe('ProductGroupController', () => {
  let userService: UserService;
  let fixtureService: FixtureService;
  let productGroupService: ProductGroupService;
  let productService: ProductService;
  let admin;

  const BRAND = 'brand';
  const PRODUCT_GROUP = 'product_group';
  const TEST_DATE = new Date();

  def(BRAND, async () => {
    return fixtureService.saveEntityUsingValues(Brand);
  });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, TestUtilsModule],
    }).compile();

    fixtureService = module.get<FixtureService>(FixtureService);
    userService = module.get<UserService>(UserService);
    productGroupService = module.get<ProductGroupService>(ProductGroupService);
    productService = module.get<ProductService>(ProductService);

    // Admin Role
    admin = await userService.findByEmail('admin_e2e@isbx.com');
  });

  describe('Product Group Unit Tests', () => {
    def(PRODUCT_GROUP, async () => {
      const brand = await get(BRAND);
      return fixtureService.saveEntityUsingValues(ProductGroup, {
        brand,
      });
    });

    it('should create a product group', async () => {
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const data = new ProductGroup();
      data.brand = { id: brand.id } as Brand;
      data.name = `CREATE-${faker.commerce.productName()} ${TEST_DATE.getTime()} PRODUCT GROUP`;
      data.description = faker.lorem.paragraph(5);

      const productGroup = await productGroupService.create(data);
      expect(productGroup).toBeTruthy();
      expect(productGroup);
    });

    it('should update a product group', async () => {
      const productGroup = await get(PRODUCT_GROUP);
      expect(productGroup).toBeTruthy();

      const data = productGroup;
      const updateProductGroupName = `CREATE-${faker.commerce.productName()} ${TEST_DATE.getTime()} PRODUCT GROUP`;
      data.name = updateProductGroupName;

      const result = await productGroupService.update(productGroup);
      expect(result.id).toBe(productGroup.id);
      expect(result.name).toBe(updateProductGroupName);
    });

    it('should get productGroup by id', async () => {
      const data = new ProductGroup();
      const brand = await get(BRAND);
      data.brand = { id: brand.id } as Brand;
      data.name = `CREATE-${faker.commerce.productName()} ${TEST_DATE.getTime()} PRODUCT GROUP`;

      const productGroup = await productGroupService.create(data);
      expect(productGroup).toBeTruthy();

      const result = await productService.findProductGroupById(productGroup.id);
      expect(result.id).toBe(productGroup.id);
    });

    it('should retrieve only 1 product per SKU if same location', async () => {
      // Expected 2 unique products only since the second is the same product from the same shop
      const productGroup = { id: 55555, name: 'MultiProductSKU' };
      const products = [
        { id: 1, name: 'ProductOne', productGroup, location: { id: 1 } },
        {
          id: 2,
          name: 'AnotherProductOneInTheSameShop',
          productGroup,
          location: { id: 1 },
        },
        {
          id: 3,
          name: 'ProductOneButDiffShop',
          productGroup,
          location: { id: 2 },
        },
      ] as Partial<Product>[];
      const expectedUniqueShopProductsInSKU = 2;
      const expectedUniqueProducts = [products[0], products[2]]; // [1] dupe should be discarded

      // Let's fake the results of findWithFilter used internally by this method
      const spyFindWithFilter = jest
        .spyOn(ProductService.prototype, 'findWithFilter')
        .mockImplementation(() =>
          Promise.resolve([products, products.length] as [Product[], number]),
        );

      // Run the method!
      const resultsUnderTest = await productService.getProductsByProductGroup(
        null,
        null,
        null,
        null,
        true,
        productGroup.id,
        null,
      );
      expect(spyFindWithFilter).toHaveBeenCalled();
      expect(_.last(resultsUnderTest)).toEqual(expectedUniqueShopProductsInSKU);
      expect(_.first(resultsUnderTest)).toEqual(
        expect.arrayContaining(expectedUniqueProducts),
      );

      spyFindWithFilter.mockRestore();
    });
  });

  describe('Expected Exceptions', () => {
    it('Should not return data if soft deleted', async () => {
      const { productNotFound: EXPECTED } = ProductExceptions;
      const brand = await get(BRAND);
      expect(brand).toBeTruthy();

      const data = new ProductGroup();
      data.brand = { id: brand.id } as Brand;
      data.name = `CREATE-${faker.commerce.productName()} ${TEST_DATE.getTime()} PRODUCT GROUP`;

      const productGroup = await productGroupService.create(data);
      expect(productGroup).toBeTruthy();

      await productGroupService.remove(productGroup.id, admin.id);

      try {
        await productService.findProductGroupById(productGroup.id);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('Should not return data if not exist', async () => {
      const { productNotFound: EXPECTED } = ProductExceptions;
      try {
        await productGroupService.findById(0); // hard-coded id
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });
  });
});
