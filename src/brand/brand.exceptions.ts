import { HttpStatus } from '@nestjs/common';
import { ExpectedExceptionMap } from '../app.interface';
import { Brand } from '../entities/brand.entity';

export const BrandExceptions: ExpectedExceptionMap = {
  brandNotFound: {
    message: 'Error: Brand not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    i18n: { 'es-PR': `Error: Marca no encontrado.` },
    failCondition: (brand: Brand) => !brand || !brand.id,
  },
};
