import { ExpectedExceptionMap } from '../app.interface';
import { HttpStatus } from '@nestjs/common';

export const DoctorExceptions: ExpectedExceptionMap = {
  doctorNotFound: {
    message: 'Error: Doctor not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: doctor => !doctor,
    i18n: { 'es-PR': 'Error: Doctor no encontrada.' },
  },
  invalidStartingLatLong: {
    message: 'Starting coordinates for sorting nearest doctors are incomplete.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: ({ startFromLat, startFromLong }) =>
      // XOR operator: startingLatLng param is optional but if present, both must be provided.
      startFromLat ? !startFromLong : startFromLong,
    i18n: {
      'es-PR':
        'Las coordenadas de inicio para la clasificación de los médicos más cercanos están incompletas.',
    },
  },
};
