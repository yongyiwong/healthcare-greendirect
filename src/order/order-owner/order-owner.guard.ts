import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as _ from 'lodash';
import { OrderService } from '../order.service';
import { UserExceptions } from '../../user/user.exceptions';
import { OrderExceptions } from '../../order/order.exceptions';
import { RoleEnum } from '../../roles/roles.enum';
import { GDExpectedException } from '../../gd-expected.exception';

@Injectable()
export class OrderOwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly orderService: OrderService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orderId = request.params.orderId;
    const user = request.user || { roles: [] };
    const userId = user.id;

    try {
      // Check if user was login
      GDExpectedException.try(UserExceptions.notLogin, user);

      // Check if Admin role
      const { Admin, SiteAdmin, Employee, Driver } = RoleEnum;
      if (
        !UserExceptions.noAdminRights.failCondition({
          userRoles: user.roles,
          allowedRoles: [Admin, SiteAdmin, Employee, Driver],
        })
      ) {
        return true;
      }
    } catch (error) {
      throw error;
    }

    // Check if owner of order
    const order = await this.orderService.getOrder(orderId, userId);
    if (order && order.user.id === userId) {
      return true;
    }

    // Not order owner
    return false;
  }
}
