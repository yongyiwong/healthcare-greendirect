import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { find } from 'lodash';

import { ProductPricing } from '../../entities/product-pricing.entity';
import { ProductPricingWeight } from '../../entities/product-pricing-weight.entity';
import { ProductService } from '../product.service';
import { GDExpectedException } from '../../gd-expected.exception';
import { ProductExceptions } from '../product.exceptions';
import { User } from '../../entities/user.entity';
import { RoleEnum } from '../../roles/roles.enum';
import { UserLocationService } from '../../user-location/user-location.service';
import { UserLocationExceptions } from '../../user-location/user-location.exceptions';

const { SiteAdmin } = RoleEnum;

@Injectable()
export class ProductPricingService {
  constructor(
    @InjectRepository(ProductPricing)
    private readonly productPricingRepository: Repository<ProductPricing>,
    @InjectRepository(ProductPricingWeight)
    private readonly productPricingWeightRepository: Repository<
      ProductPricingWeight
    >,
    private readonly productService: ProductService,
    private readonly userLocationService: UserLocationService,
  ) {}

  async upsertPricing(
    productPricing: ProductPricing,
    user: User,
  ): Promise<ProductPricing> {
    if (!productPricing.product) {
      return null;
    }

    const product = await this.productService.findById(
      productPricing.product.id,
      null,
      null,
      null,
      true,
    );

    if (find(user.roles, { name: SiteAdmin })) {
      const userAssignedLocations = await this.userLocationService.getAllByUserId(
        user.id,
      );
      GDExpectedException.try(UserLocationExceptions.notAssignedToLocation, {
        user,
        currentLocationId: product.location && product.location.id,
        userAssignedLocations,
      });
    }

    if (product.pricing) {
      productPricing.id = product.pricing.id;
      productPricing.modifiedBy = user.id;
      delete productPricing.createdBy;
    } else {
      productPricing.createdBy = user.id;
      delete productPricing.id;
    }
    return this.productPricingRepository.save(productPricing);
  }

  async upsertPricingWeights(
    productId: number,
    weightPrices: ProductPricingWeight[],
    user: User,
  ): Promise<ProductPricingWeight[]> {
    const product = await this.productService.findById(
      productId,
      null,
      null,
      null,
      true,
    );
    GDExpectedException.try(
      ProductExceptions.productPricingNotFound,
      product.pricing,
    );

    if (find(user.roles, { name: SiteAdmin })) {
      const userAssignedLocations = await this.userLocationService.getAllByUserId(
        user.id,
      );
      GDExpectedException.try(UserLocationExceptions.notAssignedToLocation, {
        user,
        currentLocationId: product.location && product.location.id,
        userAssignedLocations,
      });
    }

    const weightPricesMap = weightPrices.map(
      weightPrice =>
        ({
          ...new ProductPricingWeight(),
          id: weightPrice.id || null,
          pricing: { id: product.pricing.id },
          name: weightPrice.name,
          price: weightPrice.price,
          deleted: weightPrice.deleted,
        } as ProductPricingWeight),
    );
    return this.productPricingWeightRepository.save(weightPricesMap);
  }
}
