import { ExpectedExceptionMap } from '../app.interface';
import { HttpStatus } from '@nestjs/common';
import { FormContact } from '../entities/form-contact.entity';

export const FormContactExceptions: ExpectedExceptionMap = {
  formContactNotFound: {
    message: 'Form Contact not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (formContact: FormContact) =>
      !formContact || !formContact.id,
    i18n: { 'es-PR': 'Formulario de contacto no encontrado.' },
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
