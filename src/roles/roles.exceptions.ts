import { ExpectedExceptionMap } from '../app.interface';
import { HttpStatus } from '@nestjs/common';
import { RoleEnum } from './roles.enum';

export const RolesExceptions: ExpectedExceptionMap = {
  invalidRole: {
    message: 'Error: Invalid role.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (role: string) => {
      return !Object.keys(RoleEnum).find(key => RoleEnum[key] === role);
    },
  },
};
