import { Injectable } from '@nestjs/common';

import { ProductService } from '../product/product.service';
import { LocationService } from '../location';
import { BrandService } from '../brand/brand.service';
import { DealService } from '../deal/deal.service';
import { DoctorService } from '../doctor/doctor.service';
import { SearchParams } from '../common/search-params.interface';
import { SearchCountDto, SearchFilter } from '../common/search-count.dto';

@Injectable()
export class SearchService {
  constructor(
    private readonly productService: ProductService,
    private readonly locationService: LocationService,
    private readonly brandService: BrandService,
    private readonly dealService: DealService,
    private readonly doctorService: DoctorService,
  ) {}

  async getSearchCount(searchParams: SearchParams): Promise<SearchCountDto> {
    const { SHOPS, DOCTORS, BRANDS, DEALS, PRODUCTS } = SearchFilter;

    const results: SearchCountDto = {
      [SHOPS]: await this.locationService.getSearchCount(searchParams),
      [DOCTORS]: await this.doctorService.getSearchCount(searchParams),
      [BRANDS]: await this.brandService.getSearchCount(searchParams),
      [PRODUCTS]: await this.productService.getSearchCount(searchParams),
      [DEALS]: await this.dealService.getSearchCount(searchParams),
    };

    return results;
  }
}
