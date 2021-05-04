import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PromoBannerService } from './promo-banner.service';
import { PromoBannerController } from './promo-banner.controller';
import { PromoBanner } from '../entities/promo-banner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PromoBanner])],
  providers: [PromoBannerService],
  controllers: [PromoBannerController],
})
export class PromoBannerModule {}
