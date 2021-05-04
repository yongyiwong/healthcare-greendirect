import { ExpectedExceptionMap } from '../app.interface';
import { HttpStatus } from '@nestjs/common';
import { FormBusinessListing } from '../entities/form-business-listing.entity';

export const FormBusinessListingExceptions: ExpectedExceptionMap = {
  formBusinessListingNotFound: {
    message: 'Form Business Listing not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (formBusinessListing: FormBusinessListing) =>
      !formBusinessListing || !formBusinessListing.id,
    i18n: { 'es-PR': 'No se encontró el formulario de listado de negocios.' },
  },
  sendingFailed: {
    message: 'An unknown error has occured. Please try again later.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    i18n: {
      'es-PR':
        'Ha ocurrido un error desconocido. Por favor, inténtelo de nuevo más tarde.',
    },
  },
};
