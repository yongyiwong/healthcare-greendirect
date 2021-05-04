import { AxiosError } from 'axios';
import * as _ from 'lodash';
import * as serializeError from 'serialize-error';
import { EntityManager } from 'typeorm';

import {
  HttpException,
  HttpService,
  HttpStatus,
  Injectable, LoggerService,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import {
  LocationLog,
  LocationLogStatus,
} from '../../entities/location-log.entity';
import { Location } from '../../entities/location.entity';
import {
  ProductLog,
  ProductLogStatus,
} from '../../entities/product-log.entity';
import { ProductPricingWeight } from '../../entities/product-pricing-weight.entity';
import { ProductPricing } from '../../entities/product-pricing.entity';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';
import { NotificationService } from '../../notification/notification.service';
import { httpConfig } from '../../common/http.config';
import {GreenDirectLogger} from '../../greendirect-logger';

@Injectable()
export class BiotrackInventoryService {
  private logger: LoggerService = new GreenDirectLogger('BiotrackInventoryService');

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly httpService: HttpService,
    private readonly notificationService: NotificationService,
  ) {
  }

  async sendErrorNotificationEmail(subject: string, error: Error) {
    const configService = new ConfigService();
    await this.notificationService.sendEmail({
      from: configService.get('email.from'),
      to: configService.get('email.techSupport'),
      subject,
      message:
        'biotrack inventory sync error:\n' +
        JSON.stringify(serializeError(error), null, 2),
    });
  }

  async synchronizeInventory(userId: number) {
    const locations = await this.getLocations();
    for (const location of locations) {
      const locationLog = await this.createLocationLog(userId, location);
      if (!location.organization.posConfig) {
        await this.updateLocationLog(
          locationLog,
          LocationLogStatus.failed,
          'No POS Configuration specified',
        );
        continue;
      }
      if (!location.posId) {
        await this.updateLocationLog(
          locationLog,
          LocationLogStatus.failed,
          'No POS ID specified',
        );
        continue;
      }
      try {
        await this.synchronizeLocationInventory(locationLog, location);
      } catch (error) {
        this.sendErrorNotificationEmail(
          `GreenDirect: ${location.name} sync error`,
          error,
        );
      }
    }
    return {
      status: 200,
      message: `synchronized ${locations.length} locations.`,
      count: locations.length,
    };
  }

  async synchronizeLocationInventory(
    locationLog: LocationLog,
    location: Location,
  ) {
    await this.entityManager.transaction(async transactionalEntityManager => {
      // First, remove all inventory and then fetch from Biotrack to sync all inventory
      await this.removeAllLocationInventory(
        locationLog.user.id,
        transactionalEntityManager,
        location,
      ); // mark all products as deleted
      let count = 0;
      let page = 0;
      let inventory;
      do {
        inventory = await this.getRemoteInventory(locationLog, location, page);
        if (inventory.length === 0) {
          return this.updateLocationLog(
            locationLog,
            LocationLogStatus.failed,
            `Biotrack API returned 0 inventory for this location.`,
          );
        }
        await this.updateLocationLog(
          locationLog,
          LocationLogStatus.updatingInventory,
          `processing update of inventory with ${inventory.total} products.`,
        );
        for (const productInfo of inventory.data) {
          await this.syncInventoryItem(
            locationLog,
            location,
            transactionalEntityManager,
            productInfo,
          );
          count++;
          await this.updateLocationLogProductCount(locationLog, count);
        }
        page++; // Biotrack API is paginated
      } while (inventory.current_page < inventory.last_page);
    });

    return this.updateLocationLog(
      locationLog,
      LocationLogStatus.completed,
      'sync completed',
    );
  }

  async removeAllLocationInventory(
    userId,
    transactionalEntityManager: EntityManager,
    location: Location,
  ): Promise<any> {
    return transactionalEntityManager
      .createQueryBuilder(Product, 'product')
      .update(Product)
      .set({ deleted: true, modifiedBy: userId })
      .where('deleted = false AND location_id = :locationId', {
        locationId: location.id,
      })
      .execute();
  }

  async syncInventoryItem(
    locationLog: LocationLog,
    location: Location,
    entityManager: EntityManager,
    productInfo,
  ) {
    let product = new Product();
    product.posId = productInfo.id;
    product.location = location;
    product.name = productInfo.name;
    product.description = productInfo.description;
    product.category = productInfo.category_name;
    product.subcategory = productInfo.subcategory_name;
    product.isInStock = productInfo.in_stock;
    product.strainName = productInfo.strain_name;
    product.pricingType = productInfo.pricing_type;
    product.deleted = productInfo.is_deleted;
    if (
      !product.deleted &&
      ((productInfo.qty_available_uom === 'GR' &&
        productInfo.qty_available < 10) ||
        (productInfo.qty_available_uom === 'EA' &&
          productInfo.qty_available < 2))
    ) {
      // if low quantity then hide the product
      product.deleted = true;
    }
    product.createdBy = locationLog.user.id;
    product.modifiedBy = locationLog.user.id;
    product = await this.upsertProduct(entityManager, locationLog, product);
    if (productInfo.pricing) {
      let pricing = new ProductPricing();
      pricing.product = product;
      pricing.price = productInfo.pricing.default_price;
      pricing.pricingGroupName = productInfo.pricing.pricing_group_name;
      pricing.createdBy = locationLog.user.id;
      pricing.modifiedBy = locationLog.user.id;
      pricing = await this.upsertProductPricing(entityManager, pricing);

      await this.removeProductPricingWeight(entityManager, pricing);
      if (productInfo.pricing.weight_prices) {
        for (const weightInfo of productInfo.pricing.weight_prices) {
          const weight = new ProductPricingWeight();
          weight.pricing = pricing;
          weight.posId = weightInfo.pricing_weight_id;
          weight.name = weightInfo.name;
          weight.price = weightInfo.default_price;
          await this.upsertProductPricingWeight(entityManager, weight);
        }
      }
    }
  }

  async upsertProduct(
    transactionalEntityManager: EntityManager,
    locationLog: LocationLog,
    product: Product,
  ): Promise<Product> {
    const existingProduct = await transactionalEntityManager
      .createQueryBuilder(Product, 'product')
      .select()
      .where('location_id = :locationId AND pos_id = :posId', {
        locationId: product.location.id,
        posId: product.posId,
      })
      .getOne();
    if (existingProduct) {
      product.id = existingProduct.id;
      delete product.createdBy;
    }
    // NOTE: product log table getting really large so disabling
    // await this.inventoryLog.createProductLog(locationLog, product);
    return transactionalEntityManager.save(product);
  }

  async upsertProductPricing(
    transactionalEntityManager: EntityManager,
    productPricing: ProductPricing,
  ): Promise<ProductPricing> {
    const existingProductPricing = await transactionalEntityManager
      .createQueryBuilder(ProductPricing, 'pricing')
      .where('pricing.product_id = :productId', {
        productId: productPricing.product.id,
      })
      .getOne();
    if (existingProductPricing) {
      productPricing.id = existingProductPricing.id;
      delete productPricing.createdBy;
    }
    return transactionalEntityManager.save(productPricing);
  }

  async removeProductPricingWeight(
    transactionalEntityManager: EntityManager,
    productPricing: ProductPricing,
  ) {
    return transactionalEntityManager.update(
      ProductPricingWeight,
      {
        pricing: { id: productPricing.id },
      },
      { deleted: true },
    );
  }

  async upsertProductPricingWeight(
    transactionalEntityManager: EntityManager,
    productPricingWeight: ProductPricingWeight,
  ): Promise<ProductPricingWeight> {
    // posId is shared across products
    const existingProductPricingWeight = await transactionalEntityManager
      .createQueryBuilder(ProductPricingWeight, 'weight')
      .select()
      .where('product_pricing_id = :pricingId AND pos_id = :posId', {
        pricingId: productPricingWeight.pricing.id,
        posId: productPricingWeight.posId,
      })
      .getOne();
    if (existingProductPricingWeight) {
      productPricingWeight.id = existingProductPricingWeight.id;
    }
    if (!productPricingWeight.name) {
      productPricingWeight.name = '';
    }
    productPricingWeight.deleted = false;
    return transactionalEntityManager.save(productPricingWeight);
  }

  async getLocations(): Promise<Location[]> {
    const query = this.entityManager
      .createQueryBuilder(Location, 'location')
      .select()
      .innerJoinAndSelect('location.organization', 'organization');
    if (process.env.LOCATION_ID) {
      const locationIdStrings = process.env.LOCATION_ID.split(',');
      const locationIds = [];
      for (const locationIdString of locationIdStrings) {
        locationIds.push(+locationIdString);
      }
      query.where('location."id" IN (:...locationIds)', { locationIds });
    } else {
      query
        .where('location.deleted = false')
        .andWhere('organization.deleted = false');
    }
    return query
      .andWhere('organization.pos = :pos', { pos: 'biotrack' })
      .getMany();
  }

  async getRemoteInventory(
    locationLog: LocationLog,
    location: Location,
    page: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let apiPath: string = `${location.organization.posConfig.url}/products?location=${location.posId}&page=${page}`;
      if (location.posConfig && location.posConfig.roomId) {
        apiPath += `&roomId=${location.posConfig.roomId}`;
      }
      await this.updateLocationLog(
        locationLog,
        LocationLogStatus.startedRemoteInventory,
        `getting remote inventory for '${location.name}'; id: ${location.id}`,
      );
      this.httpService.get(apiPath, this.getHttpConfig(location)).subscribe(
        async response => {
          await this.updateLocationLog(
            locationLog,
            LocationLogStatus.completedRemoteInventory,
            `received remote inventory of ${response.data.length} products.`,
          );
          resolve(response.data);
        },
        async error => {
          error = this.getHttpError(error, `getRemoteInventory() ${apiPath}`);
          await this.updateLocationLog(
            locationLog,
            LocationLogStatus.failed,
            error.message.error,
          );
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
      return new HttpException(
        {
          status: error.response.status,
          error: `${message} ${error.response.statusText}`,
        },
        error.response.status,
      );
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
   * @param location
   */
  getHttpConfig(location: Location) {
    const posConfig = location.organization.posConfig;
    return {
      baseURL: posConfig.url,
      headers: {
        ...httpConfig.headers,
        'Content-Type': 'application/json',
      },
    };
  }

  private async createLocationLog(
    userId: number,
    location: Location,
  ): Promise<LocationLog> {
    let locationLog = new LocationLog();
    locationLog.location = new Location();
    locationLog.location.id = location.id;
    locationLog.user = new User();
    locationLog.user.id = userId;
    locationLog.status = LocationLogStatus.started;
    locationLog.message = `synchronizing location '${location.name}'; id: ${location.id}`;
    locationLog = await this.entityManager.save(LocationLog, locationLog);
    return locationLog;
  }

  private async updateLocationLog(
    locationLog: LocationLog,
    status,
    message,
  ): Promise<any> {
    locationLog.status = status;
    locationLog.message = message;
    locationLog = await this.entityManager.save(locationLog);
    return locationLog;
  }

  private async updateLocationLogProductCount(
    locationLog: LocationLog,
    count: number,
  ) {
    locationLog.productCount = count;
    locationLog = await this.entityManager.save(locationLog);
  }

  private async createProductLog(locationLog: LocationLog, product: Product) {
    const productLog = new ProductLog();
    productLog.locationLog = locationLog;
    if (product && product.id) {
      productLog.product = product;
      productLog.status = ProductLogStatus.update;
    } else {
      productLog.status = ProductLogStatus.create;
    }
    productLog.productSnapshot = product;
    return this.entityManager.save(ProductLog, productLog);
  }
}
