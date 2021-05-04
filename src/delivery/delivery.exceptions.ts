import * as _ from 'lodash';

import { HttpStatus } from '@nestjs/common';

import { ExpectedExceptionMap } from '../app.interface';
import { Delivery } from '../entities/delivery.entity';
import { User } from '../entities/user.entity';
import { RoleEnum } from '../roles/roles.enum';

export const DeliveryExceptions: ExpectedExceptionMap = {
  driverNotAssignedToDelivery: {
    message:
      'Error: Only a driver assigned to the delivery can change the status',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: ({ delivery, user }: { delivery: Delivery; user: User }) =>
      !_.find(user.roles, { name: RoleEnum.Driver })
        ? false
        : delivery.driverUser === null || user.id !== delivery.driverUser.id,
  },
};
