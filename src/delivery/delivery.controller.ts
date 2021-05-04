import { ApiUseTags, ApiImplicitQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  Req,
  Delete,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Roles } from '@sierralabs/nest-identity';
import { RoleEnum } from '../roles/roles.enum';
import { Delivery } from '../entities/delivery.entity';
import {
  RequiredPipe,
  ConfigService,
  ParseEntityPipe,
} from '@sierralabs/nest-utils';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { OrderLogUpdateDto } from '../order/dto/order-log-update.dto';
import { DeliverySearchDto } from './dto/delivery-search.dto';

const { Admin, SiteAdmin, Employee, Driver } = RoleEnum;
@ApiBearerAuth()
@ApiUseTags('Deliveries')
@Controller('deliveries')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly configService: ConfigService,
  ) {}

  @Roles(Admin, SiteAdmin, Employee, Driver)
  @Get()
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'startDate', required: false })
  @ApiImplicitQuery({ name: 'endDate', required: false })
  @ApiImplicitQuery({ name: 'locationId', required: false })
  public async search(
    @Req() request,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('locationId') locationId?: number,
  ): Promise<[DeliverySearchDto[], number]> {
    const maxSize = this.configService.get('pagination.maxPageSize') || 200;
    const defaultSize =
      this.configService.get('pagination.defaultPageSize') || 100;
    limit = Math.min(maxSize, limit || defaultSize);
    const offset = (page || 0) * limit;

    const orderTransform = {
      'id asc': 'delivery.id ASC',
      'id desc': 'delivery.id DESC',
      'deliverystatus asc': 'delivery.delivery_status ASC',
      'deliverystatus desc': 'delivery.delivery_status DESC',
    };

    if (order === undefined) {
      order = 'id desc';
    }

    const dateStart = startDate && new Date(+startDate);
    const dateEnd = endDate && new Date(+endDate);

    let orderParam = order.toLowerCase();
    orderParam = orderTransform[orderParam]
      ? orderTransform[orderParam]
      : orderTransform['id desc'];

    const orderParts = orderParam.split(' ');
    const orderConfig = {};
    orderConfig[orderParts[0]] = orderParts[1].toUpperCase();

    return this.deliveryService.getDeliveries(
      request.user,
      orderConfig,
      limit,
      offset,
      search,
      dateStart,
      dateEnd,
      locationId,
    );
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Post()
  @ApiImplicitQuery({ name: 'driverUserId', required: false })
  public async create(
    @Req() request,
    @Body(new RequiredPipe()) delivery: CreateDeliveryDto,
    @Query('driverUserId') driverUserId?: number,
  ): Promise<Delivery> {
    return this.deliveryService.createDelivery(
      request.user.id,
      delivery,
      driverUserId,
    );
  }

  @Roles(Admin, SiteAdmin, Employee, Driver)
  @Get(':id([0-9]+)')
  public async getOne(
    @Req() request,
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<DeliverySearchDto> {
    return this.deliveryService.getOne(request.user, id);
  }

  @Roles(Admin, SiteAdmin, Employee, Driver)
  @Put(':id([0-9]+)')
  public async update(
    @Req() request,
    @Param('id', new ParseIntPipe()) id: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    delivery: Delivery,
  ): Promise<Delivery> {
    delivery.id = id;
    return this.deliveryService.updateDeliveryStatus(request.user, delivery);
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Post(':deliveryId([0-9]+)/driver/:driverId([0-9]+)')
  public async addDriverToDelivery(
    @Req() request,
    @Param('deliveryId', new ParseIntPipe()) deliveryId: number,
    @Param('driverId', new ParseIntPipe()) driverId: number,
  ): Promise<Delivery> {
    return this.deliveryService.addDriverToDelivery(
      request.user.id,
      deliveryId,
      driverId,
    );
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Post(':deliveryId([0-9]+)/orders/:orderId([0-9]+)')
  public async addOrderToDelivery(
    @Req() request,
    @Param('deliveryId', new ParseIntPipe()) deliveryId: number,
    @Param('orderId', new ParseIntPipe()) orderId: number,
  ): Promise<Delivery> {
    return this.deliveryService.addOrderToDelivery(
      request.user.id,
      deliveryId,
      orderId,
    );
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Delete(':deliveryId([0-9]+)/orders/:orderId([0-9]+)')
  public async removeOrderFromDelivery(
    @Req() request,
    @Param('deliveryId', new ParseIntPipe()) deliveryId: number,
    @Param('orderId', new ParseIntPipe()) orderId: number,
  ): Promise<Delivery> {
    return this.deliveryService.removeOrderFromDelivery(
      request.user.id,
      deliveryId,
      orderId,
    );
  }

  @Roles(Admin, SiteAdmin, Employee, Driver)
  @Put(':deliveryId([0-9]+)/orders/:orderId([0-9]+)')
  public async setReceivedAmountToOrder(
    @Req() request,
    @Param('deliveryId', new ParseIntPipe()) deliveryId: number,
    @Param('orderId', new ParseIntPipe()) orderId: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    order: OrderLogUpdateDto,
  ): Promise<Delivery> {
    return this.deliveryService.setReceivedAmountToOrder(
      request.user,
      deliveryId,
      orderId,
      order,
    );
  }
}
