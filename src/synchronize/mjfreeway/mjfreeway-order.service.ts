import { AxiosError } from 'axios';
import * as _ from 'lodash';

import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpService,
  HttpStatus,
  Inject,
  Injectable, LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@sierralabs/nest-utils';

import { FreewayUser } from '../../entities/freeway-user.entity';
import { MobileCheckIn } from '../../entities/mobile-check-in.entity';
import { OrderProduct } from '../../entities/order-product.entity';
import { Order } from '../../entities/order.entity';
import { OrganizationPos } from '../../entities/organization.entity';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';
import { NotificationService } from '../../notification/notification.service';
import { OrderStatus } from '../../order/order-status.enum';
import { OrderService } from '../../order/order.service';
import { UserService } from '../../user';
import { MjfreewayUserService } from './mjfreeway-user.service';
import { httpConfig } from '../../common/http.config';
import serializeError from 'serialize-error';
import {GreenDirectLogger} from '../../greendirect-logger';

const BASE_URL = 'https://partner-gateway.mjplatform.com/v1';

/**
 * MJ Freeway "special" product ids for storing rewards.
 * This index refer to the actual product ids.
 * These ids are NOT in the GD database.
 */
export enum ClinicaVerdeProduct {
  /** First-time reward for new users */
  CHECKIN_FIRST_REWARD = 3621215,
  /** Subsequent checkins for existing users */
  CHECKIN_LOYALTY = 3621216,
}

export enum ClinicaVerdeCoupon {
  /** First-time checkin coupon code */
  FIRST_REWARD_COUPON = 'CP.000147',
  /** Subsequent checkin coupon code */
  LOYALTY_COUPON = 'CP.000148',
}

export interface PosInfo {
  organizationPosId: number;
  locationId: number;
  locationPosId: number;
  posConfig: {
    apiKey: string;
    userId: string;
    enableOrderSync: boolean;
    url?: string;
  };
  pos: string;
  userId: number;
}

@Injectable()
export class MjfreewayOrderService {
  logText = ''; // used to track console logs for email notifications
  private logger: LoggerService = new GreenDirectLogger('MjfreewayOrderService');

  constructor(
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly mjfreewayUserService: MjfreewayUserService,
    private readonly userService: UserService,
  ) {
  }

  public async submitOrder(posInfo: PosInfo, orderId: number): Promise<any> {
    const order = await this.getOrder(orderId, posInfo.userId);
    const consumer = await this.getOrCreateConsumer(posInfo, order.user);
    const remoteOrder = await this.createRemoteOrder(posInfo, consumer, order);
    return this.submitRemoteOrder(posInfo, remoteOrder.id);
  }

  public async submitOrderCustom(
    posInfo: PosInfo,
    orderId: number,
  ): Promise<any> {
    const order = await this.getOrder(orderId, posInfo.userId);
    const consumer = await this.getOrCreateConsumer(posInfo, order.user);
    const remoteOrder = await this.createRemoteOrder(posInfo, consumer, order);
    return this.submitRemoteOrderCustom(posInfo, remoteOrder.id, orderId);
  }

  public async cancelOrder(posInfo: PosInfo, orderId: number): Promise<any> {
    const order = await this.getOrder(orderId, posInfo.userId);
    return this.cancelRemoteOrder(posInfo, order.posId);
  }

  public async updateOrderStatus(
    posInfo: PosInfo,
    userId: number,
  ): Promise<any> {
    // TODO: get a list of all orders for user and sync status
    this.logger.warn(`updateOrderStatus invoked but it is incomplete. ${JSON.stringify(posInfo)} User ${userId}`);
  }

  public async updateDeliveryFulfillment(
    posInfo: PosInfo,
    order: Order,
  ): Promise<any> {
    const remoteOrder = {
      fulfillment_method: order.fullfillmentMethod,
      note: '',
    };
    remoteOrder.note += `Delivery Patient Fee: $${order.deliveryPatientFee}\n\n`;
    remoteOrder.note += `Delivery Address:\n${order.deliveryAddressLine1}\n`;
    remoteOrder.note += `${order.deliveryAddressLine2}\n`;
    remoteOrder.note += `${order.deliveryCity}, ${order.deliveryState.abbreviation}`;
    remoteOrder.note += ` ${order.deliveryPostalCode}\n\n`;
    remoteOrder.note += `Instructions: ${order.deliveryInstruction}\n\n`;
    if (!_.isEmpty(order.userNotes)) {
      remoteOrder.note += `Notes from patient: ${order.userNotes}`;
    }
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${order.posId}`;
      this.httpService
        .put(apiPath, remoteOrder, this.getHttpConfig(posInfo))
        .subscribe(
          async response => {
            resolve(response.data);
          },
          async error => {
            error = this.getHttpError(
              error,
              `updateDeliveryFulfillment() ${apiPath}`,
            );
            reject(error);
          },
        );
    });
  }

  public async createRemoteOrder(
    posInfo: PosInfo,
    consumer: any,
    order: Order,
  ): Promise<any> {
    let remoteOrder = {
      consumer_id: consumer.id,
      order_source: 'online',
      order_type: 'sales',
      fulfillment_method: 'in_store',
      note: '',
    };
    if (order.fullfillmentMethod === 'delivery') {
      remoteOrder.note += `Delivery Patient Fee:$${order.deliveryPatientFee}\n\n`;
      remoteOrder.note += `Delivery Address:\n${order.deliveryAddressLine1}\n`;
      remoteOrder.note += `${order.deliveryAddressLine2}\n`;
      remoteOrder.note += `${order.deliveryCity}, ${order.deliveryState.abbreviation}`;
      remoteOrder.note += ` ${order.deliveryPostalCode}\n\n`;
      remoteOrder.note += `Instructions: ${order.deliveryInstruction}\n\n`;
      remoteOrder.note += `Notes from patient: ${order.userNotes}`;
    }
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders`;
      this.httpService
        .post(apiPath, remoteOrder, this.getHttpConfig(posInfo))
        .subscribe(
          async response => {
            remoteOrder = response.data;
            order.posId = response.data.id;
            if (order.fullfillmentMethod === 'delivery') {
              // MJ Freeway requires a PUT for some reason
              await this.updateDeliveryFulfillment(posInfo, order);
            }
            for (const orderProduct of order.products) {
              try {
                await this.addRemoteProductToOrder(
                  posInfo,
                  orderProduct,
                  remoteOrder,
                );
              } catch (error) {
                return reject(error);
              }
            }
            resolve(remoteOrder);
          },
          async error => {
            const orderInfo = {
              id: order.id,
              fullfillmentMethod: order.fullfillmentMethod,
              created: order.created,
              modified: order.modified,
              patientNumber: order.user.patientNumber,
              identifications: order.user.identifications,
              location: order.location.id,
              locationName: order.location.name,
              history: order.history,
            };
            this.logger.error(
              'Failed to create remote order using POST ' +
                JSON.stringify(remoteOrder) +
                '.  Order provided ' +
                JSON.stringify(orderInfo) +
                ' for consumer ' +
                JSON.stringify(consumer) +
                ' with response ' +
                JSON.stringify(serializeError(error)),
            );

            error = this.getHttpError(error, `createRemoteOrder() ${apiPath}`);
            reject(error);
          },
        );
    });
  }

  public async cancelRemoteOrder(
    posInfo: PosInfo,
    remoteOrderId: number,
  ): Promise<any> {
    if (!remoteOrderId) {
      throw new BadRequestException('Order ID for POS system not provided.');
    }
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${remoteOrderId}/cancel`;
      this.httpService.post(apiPath, {}, this.getHttpConfig(posInfo)).subscribe(
        async response => {
          resolve(response.data);
        },
        async error => {
          error = this.getHttpError(error, `cancelRemoteOrder() ${apiPath}`);
          reject(error);
        },
      );
    });
  }

  public async submitRemoteOrder(
    posInfo: PosInfo,
    remoteOrderId: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${remoteOrderId}/submit`;
      this.httpService.post(apiPath, {}, this.getHttpConfig(posInfo)).subscribe(
        async response => {
          resolve(response.data);
        },
        async error => {
          error = this.getHttpError(error, `submitRemoteOrder() ${apiPath}`);
          reject(error);
        },
      );
    });
  }

  public async submitRemoteOrderCustom(
    posInfo: PosInfo,
    remoteOrderId: number,
    gdOrderId: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${remoteOrderId}/submit`;
      this.httpService.post(apiPath, {}, this.getHttpConfig(posInfo)).subscribe(
        async response => {
          resolve(response.data);
        },
        async error => {
          error = this.getHttpError(error, `submitRemoteOrder() ${apiPath}`);
          this.logger.log('ORDER ' + gdOrderId + ' MARKED CLOSE');
          await this.orderService.updateOrderStatusCustom(
            gdOrderId,
            OrderStatus.CLOSED,
            1,
          );
          reject(error);
        },
      );
    });
  }

  public async addRemoteProductToOrder(
    posInfo: PosInfo,
    orderProduct: OrderProduct,
    remoteOrder: any,
  ): Promise<any> {
    const remoteProduct = {
      quantity: orderProduct.quantity,
      item_master_id: orderProduct.product.posId,
      sold_weight: orderProduct.soldWeight,
      sold_weight_uom: orderProduct.soldWeightUnit,
      pricing_weight_id: orderProduct.productPricingWeight
        ? orderProduct.productPricingWeight.posId
        : undefined,
    };
    if (remoteProduct.sold_weight) {
      // send total sold weight (since MJ doesn't display quantity for weighted products)
      remoteProduct.sold_weight *= orderProduct.quantity;
      remoteProduct.quantity = 1;
    }
    if (orderProduct.product && orderProduct.product.pricingType === 'weight') {
      if (!remoteProduct.sold_weight) {
        remoteProduct.sold_weight = orderProduct.quantity; // default to quantity
        remoteProduct.quantity = 1;
      }
      if (!remoteProduct.sold_weight_uom) {
        remoteProduct.sold_weight_uom = 'GR';
      }
    }
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${remoteOrder.id}/products`;
      this.httpService
        .post(apiPath, remoteProduct, this.getHttpConfig(posInfo))
        .subscribe(
          async response => {
            resolve(response.data);
          },
          async error => {
            if (error.response && error.response.data) {
              if (error.response.data.errors) {
                if (error.response.data.errors.item_master_id) {
                  return resolve(error.response.data); // skip item unavailable error
                } else if (
                  error.response.data.errors.MESSAGE ===
                  'Invalid uom for convert.'
                ) {
                  // {"quantity":1,"item_master_id":2048265,"sold_weight":5,"sold_weight_uom":"GR","pricing_weight_id":15809}'
                  return resolve(error.response.data); // skip uom error
                }
              }
            }
            error = this.getHttpError(
              error,
              `addRemoteProductToOrder() ${apiPath}`,
            );
            reject(error);
          },
        );
    });
  }

  public async getOrder(orderId: number, userId: number): Promise<Order> {
    return this.orderService.getOrder(orderId, userId);
  }

  public async getRemoteOrder(
    posInfo: PosInfo,
    posOrderId: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${posOrderId}`;
      this.httpService.get(apiPath, this.getHttpConfig(posInfo)).subscribe(
        async response => {
          if (response.data) {
            resolve(response.data);
          } else {
            reject(
              new NotFoundException(
                `No order found for POS Order ID: ${posOrderId}`,
              ),
            );
          }
        },
        async error => {
          error = this.getHttpError(error, `getRemoteOrder() ${apiPath}`);
          reject(error);
        },
      );
    });
  }

  // custom order sync function to solve existing unsynched orders
  public async getRemoteOrderCustom(
    posInfo: PosInfo,
    posOrderId: number,
    gdOrderId: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${posOrderId}`;
      this.httpService.get(apiPath, this.getHttpConfig(posInfo)).subscribe(
        async response => {
          if (response.data) {
            resolve(response.data);
          } else {
            reject(
              new NotFoundException(
                `No order found for POS Order ID: ${posOrderId}`,
              ),
            );
          }
        },
        async error => {
          error = this.getHttpError(error, `getRemoteOrder() ${apiPath}`);
          this.logger.log('ORDER ' + gdOrderId + ' MARKED CLOSE');
          await this.orderService.updateOrderStatusCustom(
            gdOrderId,
            OrderStatus.CLOSED,
            1,
          );
          reject(error);
        },
      );
    });
  }
  // custom order sync function to solve existing unsynched orders

  /**
   * Check orders that have been submitted to MJ Freeway to see if
   * there has been any status updates (i.e. cancelled or completed)
   */
  public async syncSubmittedOrders(userId: number) {
    // TODO This method is screwed.  It has several race conditions.  One failure will also kill it all.  -lbradley
    const submittedOrders = await this.orderService.getOrdersByStatus(
      OrganizationPos.Mjfreeway,
      OrderStatus.SUBMITTED,
    );
    this.logger.log(
      `Checking MJ Freeway order status on ${submittedOrders.length} submitted orders`,
    );
    for (const order of submittedOrders) {
      if (!order.location.organization.posConfig.enableOrderSync) continue;

      try {
        const posInfo = await this.orderService.getPosInfo(order.id);
        if (!order.posId) {
          // order was never submitted to POS system so submit it
          this.logger.log(`sending MJ Freeway order id: ${order.id}`);
          await this.orderService.submitOrder(order.id, order.user.id);
          continue;
        }
        // const remoteOrder = await this.getRemoteOrderCustom(
        const remoteOrder = await this.getRemoteOrder(posInfo, order.posId);
        if (
          order.orderStatus !== remoteOrder.order_status &&
          remoteOrder.order_status !== 'open'
        ) {
          // Checking for order_status !== 'open' since MJ stores an order as opened
          // after submitting from online
          this.logger.log(
            `order ${order.id} ${order.orderStatus} remote MJ Freeway order ${remoteOrder.id} ${remoteOrder.order_status} update.`,
          );
          await this.orderService.updateOrderStatus(
            order.id,
            remoteOrder.order_status,
            userId,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to sync submitted orders in MJ:
          order id: ${order.id} - ${JSON.stringify(serializeError(error))}`);
      }

      // sleep time after every order sync
      await new Promise(resolve => setTimeout(resolve, 20000)); // 20 sec
    }
    return this.sendLog();
  }

  /**
   * Check orders that have been submitted to MJ Freeway to see if
   * there has been any status updates (i.e. cancelled or completed)
   */
  public async syncSubmittedOrdersCustom(userId: number, orderId: number) {
    const submittedOrders = await this.orderService.getOrdersByStatusCustom(
      OrganizationPos.Mjfreeway,
      orderId,
    );
    this.logger.log(
      `Checking MJ Freeway order status on ${submittedOrders.length} submitted orders`,
    );
    for (const order of submittedOrders) {
      if (!order.location.organization.posConfig.enableOrderSync) continue;
      const posInfo = await this.orderService.getPosInfo(order.id);
      if (!order.posId) {
        // order was never submitted to POS system so submit it
        this.logger.log(`sending MJ Freeway order id: ${order.id}`);
        await this.orderService.submitOrder(order.id, order.user.id);
        continue;
      }
      const remoteOrder = await this.getRemoteOrder(posInfo, order.posId);
      if (
        order.orderStatus !== remoteOrder.order_status &&
        remoteOrder.order_status !== 'open'
      ) {
        // Checking for order_status !== 'open' since MJ stores an order as opened
        // after submitting from online
        this.logger.log(
          `order ${order.id} ${order.orderStatus} remote MJ Freeway order ${remoteOrder.id} ${remoteOrder.order_status} update.`,
        );
        await this.orderService.updateOrderStatus(
          order.id,
          remoteOrder.order_status,
          userId,
        );
      }
    }
    return this.sendLog();
  }

  /**
   * Check orders that have been submitted to MJ Freeway to see if
   * there has been any status updates (i.e. cancelled or completed)
   */
  public async syncSubmittedOrdersCustomUser(
    userId: number,
    orderUserId: number,
  ) {
    const ordersLog = [];
    const submittedOrders = await this.orderService.getOrdersByStatusCustomUser(
      OrganizationPos.Mjfreeway,
      orderUserId,
    );
    this.logger.log(
      `Checking MJ Freeway order status on ${submittedOrders.length} submitted orders`,
    );
    for (const order of submittedOrders) {
      if (!order.location.organization.posConfig.enableOrderSync) continue;
      const posInfo = await this.orderService.getPosInfo(order.id);
      if (!order.posId) {
        ordersLog.push(order.id);
        // order was never submitted to POS system so submit it
        this.logger.log(`sending MJ Freeway order id: ${order.id}`);
        await this.orderService.submitOrder(order.id, order.user.id);
        continue;
      }
      const remoteOrder = await this.getRemoteOrder(posInfo, order.posId);
      if (
        order.orderStatus !== remoteOrder.order_status &&
        remoteOrder.order_status !== 'open'
      ) {
        ordersLog.push(order.id);
        // Checking for order_status !== 'open' since MJ stores an order as opened
        // after submitting from online
        this.logger.log(
          `order ${order.id} ${order.orderStatus} remote MJ Freeway order ${remoteOrder.id} ${remoteOrder.order_status} update.`,
        );
        await this.orderService.updateOrderStatus(
          order.id,
          remoteOrder.order_status,
          userId,
        );
      }
      // sleep time after every order sync
      await new Promise(resolve => setTimeout(resolve, 30000)); // 20 sec
    }
    return ordersLog;
  }

  /**
   * Check orders that have been submitted to MJ Freeway to see if
   * there has been any status updates (i.e. cancelled or completed)
   */
  public async syncSubmittedOrdersCustomBulk(userId: number, sDate: number) {
    const ordersLog = [];
    const submittedOrders = await this.orderService.getOrdersByStatusCustomBulk(
      OrganizationPos.Mjfreeway,
      sDate,
    );
    this.logger.log(
      `Checking MJ Freeway order status on ${submittedOrders.length} submitted orders`,
    );
    for (const order of submittedOrders) {
      if (!order.location.organization.posConfig.enableOrderSync) continue;
      const posInfo = await this.orderService.getPosInfo(order.id);
      if (!order.posId) {
        ordersLog.push(order.id);
        // order was never submitted to POS system so submit it
        this.logger.log(`sending MJ Freeway order id: ${order.id}`);
        await this.orderService.submitOrder(order.id, order.user.id);
        continue;
      }
      const remoteOrder = await this.getRemoteOrder(posInfo, order.posId);
      if (
        order.orderStatus !== remoteOrder.order_status &&
        remoteOrder.order_status !== 'open'
      ) {
        ordersLog.push(order.id);
        // Checking for order_status !== 'open' since MJ stores an order as opened
        // after submitting from online
        this.logger.log(
          `order ${order.id} ${order.orderStatus} remote MJ Freeway order ${remoteOrder.id} ${remoteOrder.order_status} update.`,
        );
        await this.orderService.updateOrderStatus(
          order.id,
          remoteOrder.order_status,
          userId,
        );
      }
      // sleep time after every order sync
      await new Promise(resolve => setTimeout(resolve, 30000)); // 20 sec
    }
    return ordersLog;
  }

  public async getOrCreateConsumer(posInfo: PosInfo, user: User): Promise<any> {
    const identification = await this.userService.getIdentification(
      user.id,
      posInfo.locationId,
    );
    if (identification) {
      const freewayUser = await this.mjfreewayUserService.findConsumerByIdentification(
        identification.posId,
      );
      return { id: freewayUser.posId };
    } else {
      const freewayIdentification = await this.mjfreewayUserService.getIdentification(
        posInfo.organizationPosId,
        user.patientNumber,
        user.mobileNumber,
        user.email,
      );
      if (freewayIdentification) {
        return { id: freewayIdentification.freewayUser.posId };
      } else {
        return this.createConsumer(posInfo, user);
      }
    }
  }

  public async createConsumer(posInfo: PosInfo, user: User): Promise<any> {
    const phoneNumber = {
      type: 'mobile',
      number: user.mobileNumber,
      active: 1,
      sms: 1,
    };
    if (phoneNumber.number) {
      // clean up the number for MJ Freeway
      phoneNumber.number = phoneNumber.number.replace('+1', '');
    }
    const consumer = {
      first_name: user.firstName,
      last_name: user.lastName,
      email_address: user.email,
      birth_date: '1900-01-01',
      gender: 'unspecified',
      type: 'recreational',
      active: 1,
      preferred_contact: 'text',
      phone_numbers: [phoneNumber],
      tags: [
        {
          tag_name: 'greendirect',
        },
      ],
    };
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/consumers`;
      this.httpService
        .post(apiPath, consumer, this.getHttpConfig(posInfo))
        .subscribe(
          async response => {
            resolve(response.data);
          },
          async error => {
            error = this.getHttpError(error, `createConsumer() ${apiPath}`);
            reject(error);
          },
        );
    });
  }

  /**
   * Helper method for getting the NestJS HttpException from AxiosResponse
   * @param error
   */
  getHttpError(error: AxiosError, message: string): HttpException {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (
        error.response.data &&
        error.response.data.errors &&
        error.response.data.errors.VALIDATION
      ) {
        let validationText = '';
        const validationObject = error.response.data.errors.VALIDATION;
        for (const key of Object.keys(validationObject)) {
          const validationDescription = validationObject[key].join(', ');
          validationText += `${key} - ${validationDescription}; `;
        }
        return new HttpException(
          {
            status: error.response.status,
            error: `${message} Validation Error: ${validationText}`,
          },
          error.response.status,
        );
      } else {
        return new HttpException(
          {
            status: error.response.status,
            error: `${message} ${error.response.statusText}`,
          },
          error.response.status,
        );
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      return new HttpException(
        {
          status: HttpStatus.REQUEST_TIMEOUT,
          error: `${message} No Response`,
        },
        HttpStatus.REQUEST_TIMEOUT,
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      return new HttpException(
        {
          status: HttpStatus.AMBIGUOUS,
          error: `${message} ${error.message}`,
        },
        HttpStatus.AMBIGUOUS,
      );
    }
  }

  /**
   * Helper method for getting the Axios HTTP config
   * @param posInfo
   */
  getHttpConfig(posInfo: PosInfo) {
    const posConfig = posInfo.posConfig;
    return {
      baseURL: BASE_URL,
      headers: {
        ...httpConfig.headers,
        'Content-Type': 'application/json',
        'x-mjf-api-key': posConfig.apiKey,
        'x-mjf-organization-id': posInfo.organizationPosId,
        'x-mjf-facility-id': posInfo.locationPosId,
        'x-mjf-user-id': posConfig.userId,
      },
    };
  }

  async sendLog() {
    if (process.env.SEND_EMAIL === '1') {
      return this.notificationService.sendEmail({
        from: this.configService.get('email.from'),
        to: this.configService.get('email.techSupport'),
        subject: 'GreenDirect: Order Synchronization Log',
        message: `Order synchronization completed: \n\n${this.logText}`,
      });
    }
  }

  /**
   * Used to file a specialized order containing non-commercial products for logging reward checkins
   * Triggered silently during sign-in to website.
   * @param mobileCheckIns latest checkins
   * @param isFirstReward optional flag indicating a first time
   */
  async submitSpecialOrderForRewards(
    user: User,
    mobileCheckIn: MobileCheckIn,
    locationPosInfo: PosInfo,
    isFirstReward = false,
  ): Promise<any> {
    if (_.isEmpty(mobileCheckIn)) {
      return null;
    }

    const consumer = await this.mjfreewayUserService.findConsumerByPhone(
      user,
      locationPosInfo.organizationPosId,
    );
    if (!consumer) {
      return null;
    }
    // Note: this order will not be persisted in GD table.
    const specialOrder = {
      consumer_id: consumer.posId,
      order_source: 'in_store',
      note: 'Special Order - Reward for Mobile Checkin',
    };
    const { CHECKIN_FIRST_REWARD, CHECKIN_LOYALTY } = ClinicaVerdeProduct;
    const product = {
      ...new Product(),
      id: isFirstReward ? CHECKIN_FIRST_REWARD : CHECKIN_LOYALTY,
    };
    const { FIRST_REWARD_COUPON, LOYALTY_COUPON } = ClinicaVerdeCoupon;
    const couponCode = isFirstReward ? FIRST_REWARD_COUPON : LOYALTY_COUPON;

    try {
      const checkinOrder: any = await this.createCheckinOrder(
        locationPosInfo,
        specialOrder,
      );
      await this.addCheckinProduct(locationPosInfo, product, checkinOrder);
      // TODO: Update when MJ Support replies
      // const couponAdd = await this.addCheckinCoupon(
      //   posInfo,
      //   couponCode,
      //   checkinOrder,
      // );
      // await this.submitRemoteOrder(posInfo, checkinOrder.id);
      return checkinOrder;
    } catch (error) {
      throw error;
    }
  }

  async createCheckinOrder(posInfo: PosInfo, checkinOrder: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders`;
      this.httpService
        .post(apiPath, checkinOrder, this.getHttpConfig(posInfo))
        .subscribe(
          async response => {
            resolve(response.data);
          },
          async error => {
            error = this.getHttpError(error, `createCheckinOrder() ${apiPath}`);
            reject(error);
          },
        );
    });
  }

  async addCheckinProduct(
    posInfo: PosInfo,
    product: Product,
    remoteOrder: any,
  ): Promise<any> {
    const checkinProduct = {
      quantity: 1,
      item_master_id: product.id,
    };
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${remoteOrder.id}/products`;
      this.httpService
        .post(apiPath, checkinProduct, this.getHttpConfig(posInfo))
        .subscribe(
          async response => {
            resolve(response.data);
          },
          async error => {
            if (error.response && error.response.data) {
              if (error.response.data.errors) {
                if (error.response.data.errors.item_master_id) {
                  return resolve(error.response.data); // skip item unavailable error
                } else if (
                  error.response.data.errors.MESSAGE ===
                  'Invalid uom for convert.'
                ) {
                  return resolve(error.response.data); // skip uom error
                }
              }
            }
            error = this.getHttpError(error, `addCheckinProduct() ${apiPath}`);
            reject(error);
          },
        );
    });
  }

  async addCheckinCoupon(
    posInfo: PosInfo,
    couponSku: string,
    remoteOrder: any,
  ): Promise<any> {
    const coupon = {
      coupon_sku: couponSku,
    };
    return new Promise(async (resolve, reject) => {
      const apiPath = BASE_URL + `/orders/${remoteOrder.id}/coupons`;
      this.httpService
        .post(apiPath, coupon, this.getHttpConfig(posInfo))
        .subscribe(
          async response => {
            resolve(response.data);
          },
          async error => {
            error = this.getHttpError(error, `addCheckinCoupon() ${apiPath}`);
            reject(error);
          },
        );
    });
  }
}
