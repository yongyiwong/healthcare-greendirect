import { AxiosError } from 'axios';
import * as _ from 'lodash';
import * as serializeError from 'serialize-error';
import { EntityManager } from 'typeorm';

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
import { InjectEntityManager } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { BiotrackUser } from '../../entities/biotrack-user.entity';
import { Location } from '../../entities/location.entity';
import { Order } from '../../entities/order.entity';
import { OrganizationPos } from '../../entities/organization.entity';
import { NotificationService } from '../../notification/notification.service';
import { OrderStatus } from '../../order/order-status.enum';
import { OrderService } from '../../order/order.service';
import { PosInfo } from '../mjfreeway/mjfreeway-order.service';
import { BiotrackUserService } from './biotrack-user.service';
import { httpConfig } from '../../common/http.config';
import {GreenDirectLogger} from '../../greendirect-logger';

export interface BiotrackOrder extends Order {
  biotrackUser: BiotrackUser;
}

@Injectable()
export class BiotrackOrderService {
  // TODO This seems insane... is this thread safe? -lbradley 29 June 2021
  logText = ''; // used to track console logs for email notifications

  private logger: LoggerService = new GreenDirectLogger('BiotrackOrderService');

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly biotrackUserService: BiotrackUserService,
  ) {
  }

  public async submitOrder(posInfo: PosInfo, orderId: number): Promise<any> {
    const biotrackUser = await this.biotrackUserService.findOrCreateBiotrackUser(
      posInfo,
    );
    const biotrackOrder = (await this.getOrder(
      orderId,
      posInfo.userId,
    )) as BiotrackOrder;
    biotrackOrder.biotrackUser = biotrackUser;
    return this.submitRemoteOrder(posInfo, biotrackOrder);
  }

  public async cancelOrder(posInfo: PosInfo, orderId: number): Promise<any> {
    const order = await this.getOrder(orderId, posInfo.userId);
    return this.cancelRemoteOrder(posInfo, order.posId);
  }

  public async cancelRemoteOrder(
    posInfo: PosInfo,
    remoteOrderId: number,
  ): Promise<any> {
    if (!remoteOrderId) {
      throw new BadRequestException('Order ID for POS system not provided.');
    }
    return new Promise(async (resolve, reject) => {
      const apiPath = posInfo.posConfig.url + `/orders/${remoteOrderId}/cancel`;
      this.httpService.put(apiPath, {}, this.getHttpConfig(posInfo)).subscribe(
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
    order: BiotrackOrder,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const location = await this.getLocation(posInfo.locationId);
      let apiPath = posInfo.posConfig.url + `/orders`;
      if (location.posConfig && location.posConfig.roomId) {
        apiPath += `?roomId=${location.posConfig.roomId}`;
      }
      this.httpService
        .post(apiPath, order, this.getHttpConfig(posInfo))
        .subscribe(
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

  public async getOrder(orderId: number, userId: number): Promise<Order> {
    return this.orderService.getOrder(orderId, userId);
  }

  public async getRemoteOrder(
    posInfo: PosInfo,
    posOrderId: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = posInfo.posConfig.url + `/orders/${posOrderId}`;
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

  /**
   * Check orders that have been submitted to Biotrack to see if
   * there has been any status updates (i.e. cancelled or completed)
   */
  public async syncSubmittedOrders(userId: number) {
    const submittedOrders = await this.orderService.getOrdersByStatus(
      OrganizationPos.Biotrack,
      OrderStatus.SUBMITTED,
    );
    this.logger.log(
      `Checking Biotrack order status on ${submittedOrders.length} submitted orders`,
    );
    for (const order of submittedOrders) {
      if (!order.location.organization.posConfig.enableOrderSync) continue;
      const posInfo = await this.orderService.getPosInfo(order.id);
      if (!order.posId) {
        // order was never submitted to POS system so submit it
        this.logger.log(
          `sending Biotrack order id: ${order.id} for ${order.location.name}`,
        );

        try {
          await this.orderService.submitOrder(order.id, order.user.id);
        } catch (error) {
          this.logger.error(
            `Failed to submit biotrack order id: ${
              order.id
            }  ${JSON.stringify(serializeError(error))}`,
          );
        }
        continue;
      }
      try {
        const remoteOrder = await this.getRemoteOrder(posInfo, order.posId);
        if (order.orderStatus !== remoteOrder.order_status) {
          this.logger.log(
            `order ${order.id} ${order.orderStatus} remote Biotrack order ${remoteOrder.id} ${remoteOrder.order_status} update.`,
          );
          await this.orderService.updateOrderStatus(
            order.id,
            remoteOrder.order_status,
            userId,
          );
        }
      } catch (error) {
        this.sendErrorNotificationEmail(
          `GreenDirect: ${order.location.name} order ${order.id} status sync error`,
          error,
        );
      }
    }
    return this.sendLog();
  }

  async getLocation(id: number): Promise<Location> {
    return this.entityManager
      .createQueryBuilder(Location, 'location')
      .select()
      .where('location."id" = :id', { id })
      .getOne();
  }

  async sendErrorNotificationEmail(subject: string, error: Error) {
    const configService = new ConfigService();
    await this.notificationService.sendEmail({
      from: configService.get('email.from'),
      to: configService.get('email.techSupport'),
      subject,
      message:
        'biotrack order sync error:\n' +
        JSON.stringify(serializeError(error), null, 2),
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
   */
  getHttpConfig(posInfo: PosInfo) {
    return {
      baseURL: posInfo.posConfig.url,
      headers: {
        ...httpConfig.headers,
        'Content-Type': 'application/json',
      },
    };
  }

  async sendLog() {
    if (process.env.SEND_EMAIL === '1') {
      return this.notificationService.sendEmail({
        from: this.configService.get('email.from'),
        to: this.configService.get('email.techSupport'),
        subject: 'GreenDirect: Biotrack Order Synchronization Log',
        message: `Order synchronization completed: \n\n${this.logText}`,
      });
    }
  }
}
