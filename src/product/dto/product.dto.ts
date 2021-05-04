import { Product } from '../../entities/product.entity';
import { LocationSearchDto } from '../../location/dto/location-search.dto';

export interface LocationProductDto {
  location: LocationSearchDto;
}
export interface ProductDto extends Partial<Product & LocationProductDto> {
  price?: number;
}
