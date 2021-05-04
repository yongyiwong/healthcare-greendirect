import { ProductGroup } from '../../entities/product-group.entity';

export interface ProductGroupDto extends Partial<ProductGroup> {
  price?: number;
}
