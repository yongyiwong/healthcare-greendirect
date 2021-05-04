import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  ApiImplicitBody,
  ApiBearerAuth,
  ApiImplicitQuery,
  ApiResponse,
  ApiUseTags,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { OwnerInterceptor, Roles } from '@sierralabs/nest-identity';
import {
  ParseEntityPipe,
  RequiredPipe,
  ParseBooleanPipe,
} from '@sierralabs/nest-utils';

import { UpdateResult } from 'typeorm';
import * as _ from 'lodash';

import { OrderProduct } from '../entities/order-product.entity';
import { Order } from '../entities/order.entity';
import { NotificationService } from '../notification/notification.service';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import {
  OrderSearchDto,
  OrderUpdateDeliveryDto,
  OrderHistoryUpdateDto,
  IdentificationParams,
} from './dto/order-search.dto';
import { OrderOwnerGuard } from './order-owner/order-owner.guard';
import { OrderExceptions as Exceptions } from './order.exceptions';
import { OrderService } from './order.service';
import { UserService } from '../user/user.service';
import { User } from '../entities/user.entity';
import { UserExceptions } from '../user/user.exceptions';
import { RoleEnum } from '../roles/roles.enum';
import { OrderCountSummaryDto } from './dto/order-count.dto';
import { OrderViewType } from './order-view-type.enum';
import { GDExpectedException } from '../gd-expected.exception';
import { OrderCoupon } from '../entities/order-coupon.entity';
import { OrderCouponService } from './order-coupon/order-coupon.service';
import { OrderStatus } from './order-status.enum';
import { OrderUpdateDto } from './dto/order-update.dto';
import { OrderProductUpdateQuantityDto } from '../order/dto/order-product-update.dto';

const { Admin, SiteAdmin, Employee, Driver } = RoleEnum;

@ApiBearerAuth()
@ApiUseTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly orderCouponService: OrderCouponService,
  ) {}

  @Roles('$authenticated')
  @Get()
  @UsePipes(new SearchValidationPipe(Order))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'status', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'selectAll', required: false, type: 'boolean' })
  @ApiImplicitQuery({ name: 'locationId', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async search(
    @Req() request,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('locationId') locationId?: number,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<[OrderSearchDto[], number]> {
    try {
      const user = (await this.userService.findById(request.user.id)) || {
        roles: [],
      };

      /*
        If using the includeDeleted flag to retrieve all orders,
        verify if they have the assigned adminstrative roles.
      */
      const allowedRoles = [Admin, SiteAdmin, Employee];
      if (includeDeleted) {
        GDExpectedException.try(UserExceptions.noAdminRights, {
          userRoles: user.roles,
          allowedRoles,
        });
      }

      return this.orderService.findWithFilter(
        user as User,
        search,
        status,
        page,
        limit,
        order,
        locationId,
        includeDeleted,
      );
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin, SiteAdmin, Driver)
  @Get('getTodayDelivery')
  @UsePipes(new SearchValidationPipe(Order))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'status', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'selectAll', required: false, type: 'boolean' })
  @ApiImplicitQuery({ name: 'locationId', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async getTodayDelivery(
    @Req() request,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('locationId') locationId?: number,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<[OrderSearchDto[], number]> {
    try {
      const user = (await this.userService.findById(request.user.id)) || {
        roles: [],
      };

      /*
        If using the includeDeleted flag to retrieve all orders,
        verify if they have the assigned adminstrative roles.
      */
      const allowedRoles = [Admin, SiteAdmin, Employee, Driver];
      if (includeDeleted) {
        GDExpectedException.try(UserExceptions.noAdminRights, {
          userRoles: user.roles,
          allowedRoles,
        });
      }

      return this.orderService.Todaydeliverdetails(
        user as User,
        search,
        status,
        page,
        limit,
        order,
        locationId,
        includeDeleted,
      );
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin, SiteAdmin)
  @Post()
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  public async create(
    @Body('order') order: Order,
    @Req() request,
  ): Promise<Order> {
    if (!order) throw new BadRequestException('order object is required.');

    // // When creating an order check the user role (if not admin then set user to owner)
    // const user = request.user;
    // if (!user.roles) user.roles = [];
    // if (!_.find(user.roles, { name: 'Admin' })) {
    //   // force current userId in order
    //   order.user = new User();
    //   order.user.id = user.id;
    // }

    // Order must have user and location specified
    if (!order.user || !order.user.id)
      throw new BadRequestException('order.user.id is required.');
    if (!order.location || !order.location.id)
      throw new BadRequestException('order.location.id is required.');

    return this.orderService.create(order);
  }

  @Roles(Admin, SiteAdmin)
  @Post(':orderId([0-9]+)/product/:productId([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  @ApiImplicitParam({ name: 'productId', type: Number })
  public async addProductToOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Param('productId', new ParseIntPipe()) productId: number,
    @Req() request,
  ): Promise<OrderProduct> {
    return this.orderService.addProduct(orderId, productId, request.user.id);
  }

  @Roles(Admin, SiteAdmin)
  @Post(':orderId([0-9]+)/product-weight/:productPricingWeightId([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  @ApiImplicitParam({ name: 'productPricingWeightId', type: Number })
  public async addProductWeightToOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Param('productPricingWeightId', new ParseIntPipe())
    productPricingWeightId: number,
    @Req() request,
  ): Promise<OrderProduct> {
    return this.orderService.addProductWeight(
      orderId,
      productPricingWeightId,
      request.user.id,
    );
  }

  @Roles('$authenticated')
  @Post('cart/product/:productId([0-9]+)')
  @ApiImplicitParam({ name: 'productId', type: Number })
  public async addProductToCart(
    @Param('productId', new ParseIntPipe()) productId: number,
    @Req() request,
  ): Promise<OrderProduct> {
    const userId = request.user.id;
    return this.orderService.addProductToCart(userId, productId);
  }

  /** Resync orderProduct to its product base, if that product was edited in CMS */
  @Roles('$authenticated')
  @Post('cart/orderProduct/:orderProductId([0-9]+)')
  @ApiImplicitParam({ name: 'orderProductId', type: Number })
  public async refreshCartProduct(
    @Param('orderProductId', new ParseIntPipe()) orderProductId: number,
    @Req() request,
  ): Promise<OrderProduct> {
    const userId = request.user.id;
    return this.orderService.refreshOrderProduct(userId, orderProductId);
  }

  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Put(':orderId([0-9]+)/quantity/:orderProductId([0-9]+)/:quantity([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  @ApiImplicitParam({ name: 'orderProductId', type: Number })
  @ApiImplicitParam({ name: 'quantity', type: Number })
  public async updateProductQuantity(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Param('orderProductId', new ParseIntPipe()) orderProductId: number,
    @Param('quantity', new ParseIntPipe()) quantity: number,
    @Req() request,
  ): Promise<UpdateResult> {
    try {
      const userId = request.user.id;
      return this.orderService.updateProductQuantity(
        orderProductId,
        quantity,
        userId,
      );
    } catch (error) {
      throw error;
    }
  }

  @Roles('$authenticated')
  @Delete('cart/products')
  public async removeAllProductsFromCart(
    @Req() request,
  ): Promise<UpdateResult> {
    const userId = request.user.id;
    return this.orderService.removeAllProductsFromCart(userId);
  }

  @Roles('$authenticated')
  @Post('cart/product-weight/:productPricingWeightId([0-9]+)')
  @ApiImplicitParam({ name: 'productPricingWeightId', type: Number })
  public async addProductWeightToCart(
    @Param('productPricingWeightId', new ParseIntPipe())
    productPricingWeightId: number,
    @Req() request,
  ) {
    const userId = request.user.id;
    return this.orderService.addProductWeightToCart(
      userId,
      productPricingWeightId,
    );
  }

  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Delete(':orderId([0-9]+)/:orderProductId([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  @ApiImplicitParam({ name: 'orderProductId', type: Number })
  public async removeProductFromOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Param('orderProductId', new ParseIntPipe()) orderProductId: number,
    @Req() request,
  ): Promise<UpdateResult> {
    try {
      const userId = request.user.id;
      return this.orderService.removeProductFromOrder(
        orderId,
        orderProductId,
        userId,
      );
    } catch (error) {
      throw error;
    }
  }

  @Roles('$authenticated')
  @Get('cart')
  public async getCart(@Req() request): Promise<Order> {
    try {
      const userId = request.user.id;
      return this.orderService.getCart(userId);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Get(':orderId([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  @ApiImplicitQuery({ name: 'allowNonOwner', required: false, type: 'boolean' })
  public async getOne(
    @Req() request,
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Query('allowNonOwner', new ParseBooleanPipe()) allowNonOwner?: boolean,
  ): Promise<Order> {
    try {
      const userId = request.user.id;

      /*
       If using the allowNonOwner flag to retrieve an order,
       verify if they have the assigned adminstrative roles.
       May need to also check OrderOwnerGuard (currently it does not allow Employee).
     */
      const allowedRoles = [Admin, SiteAdmin, Employee, Driver];
      if (allowNonOwner) {
        const user = (await this.userService.findById(userId)) || { roles: [] };
        GDExpectedException.try(UserExceptions.noAdminRights, {
          userRoles: user.roles,
          allowedRoles,
        });
      }

      return this.orderService.getOrder(orderId, userId, allowNonOwner);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Delete(':orderId([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async cancelOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Req() request,
  ): Promise<UpdateResult> {
    try {
      const userId = request.user.id;
      const order = await this.orderService.cancelOrder(orderId, userId);
      const mobileNumber = request.user.mobileNumber;
      const sms = this.orderService.composeCancelSMS(orderId, mobileNumber);
      await this.notificationService.sendTextMessage(sms);
      return order;
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Post(':orderId([0-9]+)/submit')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async submitOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Req() request,
  ): Promise<Order> {
    const userId = request.user.id;
    try {
      await this.orderService.checkSubmit(orderId, userId);
      const order = await this.orderService.submitOrder(orderId, userId);
      return order;
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Post(':orderId([0-9]+)/close')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async closeOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Req() request,
  ): Promise<UpdateResult> {
    const userId = request.user.id;
    try {
      return this.orderService.updateOrderStatus(
        orderId,
        OrderStatus.CLOSED,
        userId,
      );
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(OrderOwnerGuard)
  @Roles(Admin, SiteAdmin, Driver)
  @Put(':id([0-9]+)')
  @ApiImplicitParam({ name: 'id', type: Number })
  @ApiImplicitQuery({ name: 'skipChecks', required: false })
  public async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('skipChecks', new ParseBooleanPipe()) skipChecks: boolean,
    @Req() request,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    order: Order,
  ): Promise<UpdateResult> {
    if (!order || !order.orderStatus) {
      throw new BadRequestException('No order status provided.');
    }
    const userId = request.user.id;

    try {
      const previousOrder = await this.orderService.getOrder(id, userId, true);

      if (
        previousOrder.orderStatus === OrderStatus.OPEN &&
        order.orderStatus === OrderStatus.SUBMITTED
      ) {
        if (!skipChecks) {
          await this.orderService.checkSubmit(id, userId);
        }

        const updateResult = await this.orderService.updateOrderStatus(
          id,
          order.orderStatus,
          userId,
        );

        await this.orderService.sendOrderSubmitNotifications(previousOrder);

        return updateResult;
      } else {
        return this.orderService.updateOrderStatus(
          id,
          order.orderStatus,
          userId,
        );
      }
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(OrderOwnerGuard)
  @Roles(Admin, SiteAdmin, Driver)
  @Put('updateSelectedAllopenToCancel')
  public async updateselectAllopenToCancel(
    @Req() request,
  ): Promise<UpdateResult> {
    if (!request.body) {
      throw new BadRequestException('No order status provided.');
    }
    const userId = request.user.id;
    const checkboxselectedArray: [] = request.body;
    const selectedcheckbox = checkboxselectedArray.map(async x => {
      const orderId = x;
      try {
        const updateResult = await this.orderService.updateSelectedOrderStatusToCancel(
          userId,
          orderId,
        );
        return updateResult;
      } catch (error) {
        throw error;
      }
    });

    return;
  }

  @Put('updateSelecteddriverstatus')
  public async updatetodaydeliverydriver(
    @Req() request,
  ): Promise<UpdateResult> {
    if (!request.body) {
      throw new BadRequestException('No order status provided.');
    }
    const drivername = request.body.drivername;
    const driverid = request.body.id;
    const checkboxselectedArray: [] = request.body.order_ids;

    const selectedcheckbox = checkboxselectedArray.map(async x => {
      const orderId = x;
      try {
        const updateResult = await this.orderService.updateSelecteddeliveryStatus(
          drivername,
          driverid,
          orderId,
        );
        return updateResult;
      } catch (error) {
        throw error;
      }
    });

    return;
  }

  @UseGuards(OrderOwnerGuard)
  @Roles(Admin, SiteAdmin, Driver)
  @Put('updateOrderReady/:orderId([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async updateReadyOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Req() request,
  ): Promise<UpdateResult> {
    if (!request.body) {
      throw new BadRequestException('No order status provided.');
    }
    const orderready = request.body.message;
    const userId = request.user.id;

    const updateResult = await this.orderService.updateOrderReady(
      userId,
      orderId,
      orderready,
    );
    // const userId = request.user.id;
    // const checkboxselectedArray: [] = request.body;
    // const selectedcheckbox = checkboxselectedArray.map(async x => {
    //   const orderId = x;
    //   try {
    //     const updateResult =
    //       await this.orderService.updateSelectedOrderStatusToCancel(
    //         userId, orderId,
    //       );
    //     return updateResult;
    //   }
    //   catch (error) {
    //     throw error;
    //   }

    // });
    return updateResult;
  }

  @UseGuards(OrderOwnerGuard)
  @Roles(Admin, SiteAdmin, Driver)
  @Put('CancelOpenordersOfPatient')
  public async CancelOpenordersOfPatient(
    @Req() request,
  ): Promise<UpdateResult> {
    const userId = request.user.id;
    // const locationId = request.body.locationId;
    try {
      const updateResult = await this.orderService.CancelOpenordersOfPatient(
        userId,
      );
      return updateResult;
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(OrderOwnerGuard)
  @Roles(Admin, SiteAdmin, Driver)
  // @Put('updateAllopenToCancel/:locationId([0-9]+)')
  @Put('updateAllopenToCancel')
  public async updateAllopenToCancel(@Req() request): Promise<UpdateResult> {
    if (!request.body.locationId) {
      throw new BadRequestException('No order status provided.');
    }
    const userId = request.user.id;
    const locationId = request.body.locationId;
    try {
      const updateResult = await this.orderService.updateOrderStatusToCancel(
        userId,
        locationId,
      );
      return updateResult;
    } catch (error) {
      throw error;
    }
  }

  @Roles('$authenticated')
  @Post(':orderId([0-9]+)/reorder')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  @ApiResponse({
    status: Exceptions.invalidLocation.httpStatus,
    description: Exceptions.invalidLocation.message,
  })
  public async reOrderProducts(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Req() request,
  ): Promise<Order> {
    try {
      const userId = request.user.id;
      return this.orderService.reOrderProducts(orderId, userId);
    } catch (error) {
      throw error;
    }
  }

  @Roles('$authenticated')
  @Post('refresh')
  @ApiImplicitQuery({ name: 'orderId', required: false })
  public async refresh(
    @Req() request,
    @Query('orderId') orderId?: number,
  ): Promise<boolean> {
    try {
      const userId = request.user.id;
      if (!orderId) {
        const order = await this.orderService.getCart(userId);
        orderId = order ? order.id : 0;
      }
      await this.orderService.refreshSaveOrderTotals(orderId, userId);
    } catch (err) {
      // silence exception, dont throw
      return false;
    }
    return true;
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get('count-summary')
  @ApiImplicitQuery({ name: 'interval' })
  public async getOrderCountSummary(
    @Query('interval') interval: OrderViewType,
    @Req() request,
  ): Promise<OrderCountSummaryDto[]> {
    if (!interval) {
      interval = OrderViewType.DAILY;
    }
    return this.orderService.getOrderCountSummary(interval, request.user);
  }

  @Roles('$authenticated')
  @Get(':orderId([0-9]+)/verify-identification')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async verifyIdentification(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Req() request,
  ): Promise<boolean> {
    const userId = request.user.id;
    return this.orderService.isUserInPosSystem(orderId, userId);
  }

  @Roles('$authenticated')
  @Post(':orderId([0-9]+)/check-identification')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async checkIdentification(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Req() request,
    @Body(new RequiredPipe()) identification: IdentificationParams,
  ): Promise<boolean> {
    const userId = request.user.id;
    return this.orderService.synchronizeUserIdentification(
      orderId,
      userId,
      identification,
    );
  }

  @Roles('$authenticated')
  @Put(':id([0-9]+)/delivery')
  @ApiImplicitParam({ name: 'id', type: Number })
  public async setIsDelivery(
    @Param('id', new ParseIntPipe()) id: number,
    @Req() request,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    orderDto: OrderUpdateDeliveryDto,
  ): Promise<Order> {
    try {
      const userId = request.user.id;
      const order = await this.orderService.setOrderDelivery(
        id,
        orderDto,
        userId,
      );
      return order;
    } catch (error) {
      throw error;
    }
  }

  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      couponSku: string;
      new() {}
    },
  })
  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Post(':orderId([0-9]+)/coupon')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async addCouponToOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Body('couponSku') couponSku: string,
    @Req() request,
  ): Promise<OrderCoupon> {
    const userId = request.user.id;
    return this.orderCouponService.addCoupon(orderId, couponSku, userId);
  }

  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Delete(':orderId([0-9]+)/coupon/:couponId([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  @ApiImplicitParam({ name: 'couponId', type: Number })
  public async deleteCouponFromOrder(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Param('couponId', new ParseIntPipe()) couponId: number,
    @Req() request,
  ): Promise<UpdateResult> {
    const userId = request.user.id;
    return this.orderCouponService.deleteCoupon(orderId, couponId, userId);
  }

  @Roles(Admin, SiteAdmin)
  @Post(':orderId([0-9]+)/override-date')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async overrideHistoryCreatedDate(
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    order: OrderHistoryUpdateDto,
    @Req() request,
  ): Promise<Order> {
    return this.orderService.overrideHistoryCreatedDate(
      orderId,
      request.user.id,
      order,
    );
  }

  /**
   * Only updates fields defined in OrderUpdateDto.
   * This should be PATCH but our api service doesnt have a method for a PATCH request.
   */
  @UseGuards(OrderOwnerGuard)
  @Roles('$authenticated')
  @Post(':orderId([0-9]+)')
  @ApiImplicitParam({ name: 'orderId', type: Number })
  public async updateFields(
    @Param('orderId', new ParseIntPipe()) id: number,
    @Req() request,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({
        validate: { whitelist: true, forbidNonWhitelisted: true },
      }),
    )
    order: OrderUpdateDto,
  ) {
    const userId = request.user.id;
    return this.orderService.update(id, order, userId);
  }

  @Roles(Admin, Driver)
  @Post('products/quantity')
  public async updateOrderProductsQuantity(
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    orderProducts: OrderProductUpdateQuantityDto[],
    @Req() request,
  ): Promise<OrderProduct[]> {
    return this.orderService.updateOrderProductsQuantity(
      orderProducts,
      request.user.id,
    );
  }
}
