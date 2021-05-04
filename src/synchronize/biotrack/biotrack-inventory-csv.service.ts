import { PricingType } from '../../location/dto/location-search.dto';
import { EntityManager } from 'typeorm';

import {Injectable, LoggerService} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { Location } from '../../entities/location.entity';
import { ProductPricingWeight } from '../../entities/product-pricing-weight.entity';
import { ProductPricing } from '../../entities/product-pricing.entity';
import { Product } from '../../entities/product.entity';
import { InventoryLog } from '../mjfreeway/mjfreeway-inventory.service';
import { GreenDirectLogger } from '../../greendirect-logger';

export interface BiotrackInventory {
  posId: number;
  name: string;
  pricingType: string;
  pricePoint: string;
  quantity: string;
  isInStock: string;
  category: string;
  subcategory: string;
  isMedicated: string;
  strainId: number;
  strainName: string;
  deleted: string;
}

@Injectable()
export class BiotrackCSVInventoryService {
  private inventoryLog: InventoryLog;
  private logger: LoggerService = new GreenDirectLogger('BiotrackCSVInventoryService');

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async synchronizeBiotrackInventory(biotrackInventory: BiotrackInventory[]) {
    const adminId = 1;
    const location = await this.entityManager
      .createQueryBuilder(Location, 'location')
      .select()
      .innerJoin('location.organization', 'organization')
      .where(`organization.name = 'Cannacity Clinic'`)
      .getOne();
    await this.entityManager.transaction(async transactionalEntityManager => {
      this.removeAllLocationInventory(
        adminId,
        transactionalEntityManager,
        location,
      );
    });
    for (let index = 0; index < biotrackInventory.length; index++) {
      const bioInventory = biotrackInventory[index];
      const product = new Product();
      product.posId = bioInventory.posId;
      product.location = location;
      product.name = bioInventory.name;
      product.category = bioInventory.category;
      product.subcategory = bioInventory.subcategory;
      product.isInStock = !!parseInt(bioInventory.isInStock, 10);
      product.isMedicated = !!parseInt(bioInventory.isMedicated, 10);
      product.strainId = bioInventory.strainId;
      product.strainName = bioInventory.strainName;
      product.pricingType = bioInventory.pricingType;
      product.deleted = !!parseInt(bioInventory.deleted, 10);
      if (
        !product.deleted &&
        ((bioInventory.pricingType === PricingType.Weight &&
          parseInt(bioInventory.quantity, 10) < 10) ||
          (bioInventory.pricingType === PricingType.Unit &&
            parseInt(bioInventory.quantity, 10) < 2))
      ) {
        product.deleted = true;
      }
      product.createdBy = adminId;
      product.modifiedBy = adminId;
      await this.upsertProduct(this.entityManager, product);

      this.logger.log(
        `${index} of ${biotrackInventory.length} updated product id ${product.id} for ${product.name}`,
      );

      if (bioInventory.pricePoint && bioInventory.pricePoint.length > 4) {
        const priceArray = bioInventory.pricePoint.split(',');
        const pricing = new ProductPricing();
        pricing.product = product;
        pricing.price = parseInt(priceArray[0].substring(4), 10);
        pricing.createdBy = adminId;
        pricing.modifiedBy = adminId;
        await this.upsertProductPricing(this.entityManager, pricing);
        if (product.pricingType === 'weight') {
          const weight = new ProductPricingWeight();
          weight.pricing = pricing;
          weight.name = priceArray[1] + priceArray[2];
          weight.price = parseInt(priceArray[0].substring(4), 10);
          await this.upsertProductPricingWeight(this.entityManager, weight);
        }
      }
    }
  }

  async upsertProduct(
    transactionalEntityManager: EntityManager,
    product: Product,
  ): Promise<Product> {
    const existingProduct = await transactionalEntityManager
      .createQueryBuilder(Product, 'product')
      .select()
      .where('pos_id =:posId', {
        posId: product.posId,
      })
      .getOne();
    if (existingProduct) {
      product.id = existingProduct.id;
      delete product.createdBy;
    }
    return transactionalEntityManager.save(product);
  }

  async upsertProductPricing(
    transactionalEntityManager: EntityManager,
    productPricing: ProductPricing,
  ): Promise<ProductPricing> {
    const existingProductPricing = await transactionalEntityManager
      .createQueryBuilder(ProductPricing, 'pricing')
      .where('pricing.product_id = :productId', {
        productId: productPricing.product.id,
      })
      .getOne();
    if (existingProductPricing) {
      productPricing.id = existingProductPricing.id;
      delete productPricing.createdBy;
    }
    return transactionalEntityManager.save(productPricing);
  }

  async upsertProductPricingWeight(
    transactionalEntityManager: EntityManager,
    productPricingWeight: ProductPricingWeight,
  ): Promise<ProductPricingWeight> {
    const existingProductPricingWeight = await transactionalEntityManager
      .createQueryBuilder(ProductPricingWeight, 'weight')
      .select()
      .where('product_pricing_id = :pricingId AND pos_id = :posId', {
        pricingId: productPricingWeight.pricing.id,
        posId: productPricingWeight.posId,
      })
      .getOne();
    if (existingProductPricingWeight) {
      productPricingWeight.id = existingProductPricingWeight.id;
    }
    productPricingWeight.deleted = false;
    return transactionalEntityManager.save(productPricingWeight);
  }

  async removeAllLocationInventory(
    userId,
    transactionalEntityManager: EntityManager,
    location: Location,
  ): Promise<any> {
    return transactionalEntityManager
      .createQueryBuilder(Product, 'product')
      .update(Product)
      .set({ deleted: true, modifiedBy: userId })
      .where('deleted = false AND location_id = :locationId', {
        locationId: location.id,
      })
      .execute();
  }
}
