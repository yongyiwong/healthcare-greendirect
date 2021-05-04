import { HttpStatus } from '@nestjs/common';
import { intersection } from 'lodash';
import { Role } from '@sierralabs/nest-identity';

import { ExpectedExceptionMap } from '../app.interface';
import { User } from '../entities/user.entity';
import { UserAddress } from '../entities/user-address.entity';
import { Organization } from '../entities/organization.entity';

export const UserExceptions: ExpectedExceptionMap = {
  requiredPropertiesMissing: {
    message: 'Please provide all required fields.',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: { 'es-PR': 'Por favor proporcione todos los campos requeridos' },
    failCondition: error =>
      /^.*violates not-null constraint.*$/.test(error.message),
  },
  accountExists: {
    message: 'Account Email exists.',
    httpStatus: HttpStatus.CONFLICT,
    failCondition: error =>
      /^duplicate key value violates unique constraint "user__email__uq"/.test(
        error.message,
      ) ||
      /^Duplicate email/.test(error.message) ||
      HttpStatus.CONFLICT === error.status,
    i18n: { 'es-PR': 'Cuenta de correo electrónico existe.' },
  },
  loginFailed: {
    message: 'Login failed. Please double-check your credentials.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    i18n: {
      'es-PR':
        'Error de inicio de sesion. Por favor, compruebe sus credenciales.',
    },
  },
  passwordIncorrect: {
    message: 'Password is incorrect.',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: { 'es-PR': 'La contraseña es incorrecta.' },
  },
  tokenRequired: {
    message: 'Token required.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    i18n: { 'es-PR': 'Token requerido.' },
    failCondition: jwtToken => !jwtToken,
  },
  tokenExpired: {
    message: 'Reset password link has expired.',
    i18n: { 'es-PR': 'El enlace para restablecer la contraseña ha caducado' },
    httpStatus: HttpStatus.UNAUTHORIZED,
    failCondition: error => /^jwt expired/.test(error.message),
  },
  tokenInvalid: {
    message:
      'Invalid token. Please use the link you received in your Reset Password email.',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: {
      'es-PR':
        'Simbolo no valido. Utilice el enlace que recibió en el correo electrónico de Restablecer contraseña.',
    },
    failCondition: error => /^jwt malformed/.test(error.message),
  },
  secretMisMatched: {
    message:
      'Invalid token. Please use the link you received in your Reset Password email.',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: {
      'es-PR':
        'Simbolo no valido. Utilice el enlace que recibió en el correo electrónico de Restablecer contraseña.',
    },
    failCondition: error => /^invalid signature/.test(error.message),
  },
  noAdminRights: {
    message: 'Your role is not authorized for access.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    /**
     * failCondition: (context) = list of user roles compared to an array of allowed administrative Role names.
     */ failCondition: (context: {
      userRoles: Role[];
      allowedRoles: string[];
    }) => {
      return !intersection(
        context.allowedRoles,
        context.userRoles.map(ur => ur.name),
      ).length;
    },
  },
  notLogin: {
    message: 'Not logged in.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    i18n: { 'es-PR': 'Sin iniciar sesión.' },
    failCondition: (user: User) => !user.id,
  },
  userNotVerified: {
    message: 'Error: Please verify your phone number.',
    httpStatus: HttpStatus.FORBIDDEN,
    i18n: { 'es-PR': 'Error: Por favor verifique su número de teléfono.' },
    failCondition: (user: User) => user.mobileNumber && !user.verified,
  },
  userNotFound: {
    message: 'Error: User not found',
    httpStatus: HttpStatus.NOT_FOUND,
    i18n: { 'es-PR': 'Error: Usuario no encontrado' },
    failCondition: (user: User) => !user || !user.id,
  },
  maxAddressNumExceeded: {
    message: 'Only a maximum of 10 delivery addresses is allowed.',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: {
      'es-PR': 'Sólo se permite un máximo de 10 direcciones de entrega.',
    },
    failCondition: existingAddressesCount => existingAddressesCount >= 10,
  },
  userAddressNotFound: {
    message: 'Error: Address not found',
    httpStatus: HttpStatus.NOT_FOUND,
    i18n: { 'es-PR': 'Error: Dirección no encontrada' },
    failCondition: (userAddress: UserAddress) =>
      !userAddress || !userAddress.id,
  },
  mobileNumberRequired: {
    message: 'Please provide a mobile number',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: { 'es-PR': 'Por favor proporcione un número de móvil' },
    failCondition: (mobileNumber: string) => !mobileNumber,
  },
  emailRequired: {
    message: 'Please provide an email',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: { 'es-PR': 'Por favor proporcione un correo electrónico' },
    failCondition: (email: string) => !email,
  },
  noAssignedOrganization: {
    message: 'Error: User has no assigned company.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (organization: Organization) => !organization,
  },
  patientNumberFailed: {
    message: 'Please provide correct patient number format.',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: {
      'es-PR':
        'Proporcione el formato de número de paciente correcto.',
    },
  },
};
