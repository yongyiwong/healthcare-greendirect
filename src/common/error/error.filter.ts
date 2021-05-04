import {
  ExceptionFilter,
  Catch,
  HttpException,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import * as log from 'fancy-log';
import {
  GDExpectedException,
  ExpectedException,
} from '../../gd-expected.exception';

interface GDJSONErrorMessage {
  error: string;
  i18n?: { [locale: string]: string };
}

export const internalServerError: ExpectedException = {
  message: 'Internal server error',
  httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  i18n: { 'es-PR': 'Error interno de servidor' },
};

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: GDJSONErrorMessage = {
      error: internalServerError.message,
      i18n: internalServerError.i18n,
    };
    // default to 500

    // For Expected Exceptions,
    // wrap the error as a simple object
    if (error instanceof GDExpectedException) {
      const { message, httpStatus, i18n } = error as GDExpectedException;
      status = httpStatus;
      payload = {
        error: message,
        i18n,
      };
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      if (typeof error.message === 'string') {
        payload.error = error.message;
      } else {
        // We passed an object to the HttpException constructor instead of string,
        // need to extract inner message.
        const exception = (error.message ||
          internalServerError) as ExpectedException;
        payload = {
          error: exception.message || error.message.error,
          i18n: exception.i18n,
        };
      }
    }
    // otherwise, just use default 500, and log them below.
    // Log for server-side investigation, ignoring 404 errors.
    if (status !== 404 && status !== 401) {
      log.error(status, payload);
      log.error('Stack trace', JSON.stringify(error.stack));
    }

    return response.status(status).send(payload);
  }
}
