import * as _ from 'lodash';
import {
  OrderByCondition,
  Repository,
  Transaction,
  TransactionRepository,
  UpdateResult,
} from 'typeorm';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { DeliveryLog } from '../entities/delivery-log.entity';
import { Delivery } from '../entities/delivery.entity';
import { OrderLog } from '../entities/order-log.entity';
import { Order } from '../entities/order.entity';
import { UserLocation } from '../entities/user-location.entity';
import { User } from '../entities/user.entity';
import { GDExpectedException } from '../gd-expected.exception';
import { OrderLogUpdateDto } from '../order/dto/order-log-update.dto';
import { RoleEnum } from '../roles/roles.enum';
import { DeliveryExceptions } from './delivery.exceptions';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliverySearchDto } from './dto/delivery-search.dto';
import { OrderStatus } from '../order/order-status.enum';
import { OrderService } from '../order/order.service';

@Injectable()
export class DeliveryService {
  constructor(
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @InjectRepository(Delivery)
    protected readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(Order)
    protected readonly orderRepository: Repository<Order>,
  ) {}

  public async getDeliveries(
    user: User,
    order: OrderByCondition,
    limit: number = 100,
    offset: number = 0,
    search?: string,
    startDate?: Date,
    endDate?: Date,
    locationId?: number,
  ): Promise<[DeliverySearchDto[], number]> {
    try {
      const query = this.deliveryRepository
        .createQueryBuilder('delivery')
        .select()
        .addSelect('location.name')
        .leftJoin('delivery.location', 'location')
        .addSelect([
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.mobileNumber',
        ])
        .leftJoin('delivery.driverUser', 'user')
        .leftJoinAndSelect('delivery.orders', 'orders')
        .leftJoinAndSelect('orders.products', 'orderProducts')
        .leftJoinAndSelect('orderProducts.product', 'product')
        .leftJoinAndSelect('product.images', 'productImages')
        .loadRelationCountAndMap(
          'orders.productCount',
          'orders.products',
          'orderProducts',
        );

      if (search) {
        const filter = '%' + search + '%'; // wildcard search
        query.andWhere(
          `"user".first_name::text ILIKE :filter
        OR "user".last_name::text ILIKE :filter`,
          {
            filter,
          },
        );
      }

      if (startDate && endDate) {
        query.andWhere('delivery.created BETWEEN :startDate and :endDate', {
          startDate,
          endDate,
        });
      }

      if (locationId) {
        query.andWhere('delivery.location_id = :locationId', { locationId });
      }

      // if user has driver role, only select deliveries
      // where the user is the same as the driverUser
      if (_.find(user.roles, { name: RoleEnum.Driver })) {
        query.andWhere('delivery.driver_user_id = :userId', {
          userId: user.id,
        });
      }

      // if user has no role, is a Site Admin, or an employee
      // only select deliveries for their assigned locations
      if (
        !user.roles ||
        _.find(user.roles, { name: RoleEnum.SiteAdmin }) ||
        _.find(user.roles, { name: RoleEnum.Employee })
      ) {
        query.andWhere(queryBuilder => {
          const subQuery = queryBuilder
            .subQuery()
            .select(['userLocation.location_id'])
            .from(UserLocation, 'userLocation')
            .where(
              'userLocation.user_id = :userId AND userLocation.deleted = false',
              { userId: user.id },
            )
            .getQuery();

          return 'location.id IN ' + subQuery;
        });
      }

      query
        .orderBy(order)
        .limit(limit)
        .offset(offset);
      const count = await query.getCount();
      const deliveries: any = await query.getMany();
      return Promise.resolve([deliveries, count]) as Promise<
        [DeliverySearchDto[], number]
      >;
    } catch (error) {
      throw error;
    }
  }

  public async createDelivery(
    userId: number,
    deliveryDto: CreateDeliveryDto,
    driverUserId?: number,
  ): Promise<Delivery> {
    let result: Delivery = null;
    try {
      const delivery = new Delivery();
      delivery.location = deliveryDto.location;
      delivery.createdBy = userId;
      delivery.modifiedBy = userId;
      if (driverUserId) {
        delivery.driverUser = new User();
        delivery.driverUser.id = driverUserId;
      }
      result = await this.deliveryRepository.save(delivery);

      if (_.isEmpty(deliveryDto.orders)) {
        delete deliveryDto.orders;
      }

      if (deliveryDto.orders) {
        const updatedOrders: Promise<UpdateResult>[] = [];
        deliveryDto.orders.map((orderId: number) => {
          updatedOrders.push(
            this.orderService.updateOrderStatus(
              orderId,
              OrderStatus.DELIVERY,
              userId,
              result.id,
            ),
          );
        });
        await Promise.all(updatedOrders);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  public async getOne(
    user: User,
    deliveryId: number,
  ): Promise<DeliverySearchDto> {
    try {
      const query = this.deliveryRepository
        .createQueryBuilder('delivery')
        .select()
        .addSelect('location.name')
        .leftJoin('delivery.location', 'location')
        .addSelect([
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.mobileNumber',
        ])
        .leftJoin('delivery.driverUser', 'user')
        .leftJoinAndSelect('delivery.orders', 'orders')
        .loadRelationCountAndMap(
          'orders.productCount',
          'orders.products',
          'orderProducts',
        )
        .where('delivery.id = :id', { id: deliveryId });

      // if user has driver role, only select a delivery
      // where the user is the same as the driverUser
      if (_.find(user.roles, { name: RoleEnum.Driver })) {
        query.andWhere('delivery.driver_user_id = :userId', {
          userId: user.id,
        });
      }

      // if user has no role, is a Site Admin, or an employee
      // only select a delivery for their assigned locations
      if (
        !user.roles ||
        _.find(user.roles, { name: RoleEnum.SiteAdmin }) ||
        _.find(user.roles, { name: RoleEnum.Employee })
      ) {
        query.andWhere(queryBuilder => {
          const subQuery = queryBuilder
            .subQuery()
            .select(['userLocation.location_id'])
            .from(UserLocation, 'userLocation')
            .where(
              'userLocation.user_id = :userId AND userLocation.deleted = false',
              { userId: user.id },
            )
            .getQuery();

          return 'location.id IN ' + subQuery;
        });
      }

      return (query.getOne() as any) as Promise<DeliverySearchDto>;
    } catch (error) {
      throw error;
    }
  }

  @Transaction()
  public async updateDeliveryStatus(
    user: User,
    delivery: UpdateDeliveryDto,
    @TransactionRepository(Delivery) deliveryRepository?: Repository<Delivery>,
    @TransactionRepository(DeliveryLog)
    deliveryLogRepository?: Repository<DeliveryLog>,
  ): Promise<Delivery> {
    try {
      const getDelivery = await this.deliveryRepository
        .createQueryBuilder('delivery')
        .select()
        .addSelect(['user.id'])
        .leftJoin('delivery.driverUser', 'user')
        .where('delivery.id = :id', { id: delivery.id })
        .getOne();

      // check userId is driverUserId
      GDExpectedException.try(DeliveryExceptions.driverNotAssignedToDelivery, {
        delivery: getDelivery,
        user,
      });

      // update delivery with deliveryStatus
      delivery.modifiedBy = user.id;
      await deliveryRepository.save(delivery);

      // then create new deliveryLog entry
      const deliveryLog = new DeliveryLog();
      deliveryLog.delivery = new Delivery();
      deliveryLog.delivery.id = delivery.id;
      if (getDelivery.driverUser) {
        deliveryLog.driverUser = new User();
        deliveryLog.driverUser.id = getDelivery.driverUser.id;
      }
      deliveryLog.createdBy = user.id;
      deliveryLog.deliveryStatus = delivery.deliveryStatus;
      await deliveryLogRepository.insert(deliveryLog);

      // return the delivery
      return deliveryRepository.findOne(delivery.id);
    } catch (error) {
      throw error;
    }
  }

  @Transaction()
  public async addDriverToDelivery(
    userId: number,
    deliveryId: number,
    driverId: number,
    @TransactionRepository(Delivery) deliveryRepository?: Repository<Delivery>,
    @TransactionRepository(DeliveryLog)
    deliveryLogRepository?: Repository<DeliveryLog>,
  ): Promise<Delivery> {
    try {
      const getDelivery = await this.deliveryRepository
        .createQueryBuilder('delivery')
        .select()
        .addSelect(['user.id'])
        .leftJoin('delivery.driverUser', 'user')
        .where('delivery.id = :id', { id: deliveryId })
        .getOne();

      // first update delivery
      const delivery = new Delivery();
      delivery.modifiedBy = userId;
      delivery.id = deliveryId;
      delivery.driverUser = new User();
      delivery.driverUser.id = driverId;
      await deliveryRepository.save(delivery);

      // then create new deliveryLog entry
      const deliveryLog = new DeliveryLog();
      deliveryLog.delivery = new Delivery();
      deliveryLog.delivery.id = deliveryId;
      deliveryLog.driverUser = new User();
      deliveryLog.driverUser.id = driverId;
      deliveryLog.deliveryStatus = getDelivery.deliveryStatus;
      deliveryLog.createdBy = userId;
      await deliveryLogRepository.insert(deliveryLog);

      return deliveryRepository.findOne(deliveryId);
    } catch (error) {
      throw error;
    }
  }

  public async addOrderToDelivery(
    userId: number,
    deliveryId: number,
    orderId: number,
  ): Promise<Delivery> {
    try {
      await this.orderService.updateOrderStatus(
        orderId,
        OrderStatus.DELIVERY,
        userId,
        deliveryId,
      );
      return this.deliveryRepository.findOne(deliveryId);
    } catch (error) {
      throw error;
    }
  }

  public async removeOrderFromDelivery(
    userId: number,
    deliveryId: number,
    orderId: number,
  ): Promise<Delivery> {
    try {
      const order = new Order();
      order.modifiedBy = userId;
      order.id = orderId;
      order.orderStatus = OrderStatus.SUBMITTED;

      order.delivery = new Delivery();
      order.delivery.id = null;

      await this.orderRepository.save(order);
      return this.deliveryRepository.findOne(deliveryId);
    } catch (error) {
      throw error;
    }
  }

  @Transaction()
  public async setReceivedAmountToOrder(
    user: User,
    deliveryId: number,
    orderId: number,
    order: OrderLogUpdateDto,
    @TransactionRepository(Order) orderRepository?: Repository<Order>,
    @TransactionRepository(OrderLog) orderLogRepository?: Repository<OrderLog>,
  ): Promise<Delivery> {
    try {
      const getDelivery = await this.deliveryRepository
        .createQueryBuilder('delivery')
        .select()
        .addSelect(['user.id'])
        .leftJoin('delivery.driverUser', 'user')
        .where('delivery.id = :id', { id: deliveryId })
        .getOne();

      // check userId is driverUserId
      GDExpectedException.try(DeliveryExceptions.driverNotAssignedToDelivery, {
        delivery: getDelivery,
        user,
      });

      // first update order
      // TODO: update order with remaining DTO keys such as paymentCompletedDate
      const newOrder = new Order();
      newOrder.modifiedBy = user.id;
      newOrder.id = orderId;
      newOrder.receivedAmount = order.receivedAmount;
      newOrder.note = order.note;
      await orderRepository.save(newOrder);

      // then update order log
      // TODO: update newOrderLog with remaining DTO keys such as paymentCompletedDate
      const newOrderLog = new OrderLog();
      newOrderLog.order = new Order();
      newOrderLog.order.id = order.orderId;
      newOrderLog.receivedAmount = order.receivedAmount;
      newOrderLog.note = order.note;
      newOrderLog.createdBy = user.id;
      await orderLogRepository.save(newOrderLog);

      // return the delivery
      return this.deliveryRepository.findOne(deliveryId);
    } catch (error) {
      throw error;
    }
  }
}
