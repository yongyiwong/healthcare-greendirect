import { HttpStatus } from '@nestjs/common';

import { ExpectedExceptionMap } from '../app.interface';
import { SignInLink } from '../entities/sign-in-link.entity';

export const SignInLinkExceptions: ExpectedExceptionMap = {
  signInLinkInvalid: {
    message: 'Error: Sign-in link invalid or expired',
    httpStatus: HttpStatus.NOT_FOUND,
    i18n: {
      'es-PR': `Error: el enlace de inicio de sesión no es válido o ha caducado`,
    },
    failCondition: (signInLink: SignInLink) =>
      !signInLink || !signInLink.active,
  },
};
