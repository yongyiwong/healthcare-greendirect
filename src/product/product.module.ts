import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../entities/product.entity';
import { ProductController } from './product.controller';
import { ProductGroup } from '../entities/product-group.entity';
import { ProductGroupController } from './product-group.controller';
import { ProductGroupService } from './product-group.service';
import { ProductImage } from '../entities/product-image.entity';
import { ProductPricing } from '../entities/product-pricing.entity';
import { ProductPricingWeight } from '../entities/product-pricing-weight.entity';
import { ProductService } from './product.service';
import { ProductPricingService } from './product-pricing/product-pricing.service';
import { UserLocationModule } from '../user-location/user-location.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductGroup,
      ProductImage,
      ProductPricing,
      ProductPricingWeight,
    ]),
    HttpModule,
    UserLocationModule,
  ],
  controllers: [ProductController, ProductGroupController],
  providers: [
    ProductService,
    ProductGroupService,
    ProductPricingService,
  ],
  exports: [ProductService, ProductGroupService, ProductPricingService],
})
export class ProductModule {}
