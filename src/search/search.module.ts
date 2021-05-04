import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ProductModule } from '../product/product.module';
import { LocationModule } from '../location';
import { BrandModule } from '../brand/brand.module';
import { DealModule } from '../deal/deal.module';
import { DoctorModule } from '../doctor/doctor.module';

@Module({
  imports: [
    ProductModule,
    LocationModule,
    BrandModule,
    DealModule,
    DoctorModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
