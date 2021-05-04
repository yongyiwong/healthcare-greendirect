import { HttpStatus } from '@nestjs/common';
import { ExpectedExceptionMap } from '../app.interface';
import { Product } from '../entities/product.entity';
import { ProductPricing } from '../entities/product-pricing.entity';

export const ProductExceptions: ExpectedExceptionMap = {
  productNotFound: {
    message: 'Error: Product not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    i18n: { 'es-PR': `Error: Producto no encontrado.` },
    failCondition: (product: Product) => !product || !product.id,
  },
  productPricingNotFound: {
    message: 'Error: Product pricing not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (pricing: ProductPricing) => !pricing || !pricing.id,
  },
};
