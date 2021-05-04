import * as _ from 'lodash';
import { AxiosError } from 'axios';
import { EntityManager } from 'typeorm';
import {
  HttpException,
  HttpService,
  HttpStatus,
  Injectable, LoggerService,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import {
  LocationLog,
  LocationLogStatus,
} from '../../entities/location-log.entity';
import { Location } from '../../entities/location.entity';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductPricingWeight } from '../../entities/product-pricing-weight.entity';
import { ProductPricing } from '../../entities/product-pricing.entity';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';
import {
  ProductLog,
  ProductLogStatus,
} from '../../entities/product-log.entity';
import { httpConfig } from '../../common/http.config';
import {GreenDirectLogger} from '../../greendirect-logger';

const BASE_URL = 'https://partner-gateway.mjplatform.com/v1';

export interface PromiseRegistration {
  promise: {
    resolve: (value?) => void;
    reject: (reason?) => void;
  };
  lastRequest: Date;
}

export class InventoryLog {
  private inventoryUpdateRegistrations = [];
  private locationLogs: LocationLog[];

  constructor(private readonly entityManager: EntityManager) {
    this.inventoryUpdateRegistrations = [];
    this.locationLogs = [];
  }

  registerInventoryUpdate(promiseRegistration: PromiseRegistration) {
    this.inventoryUpdateRegistrations.push(promiseRegistration);
  }

  notifyInventoryRegistrations() {
    for (const promiseRegistration of this.inventoryUpdateRegistrations) {
      const locationLogs = [];
      for (const locationLog of this.locationLogs) {
        if (locationLog.modified > promiseRegistration.lastRequest) {
          locationLogs.push(locationLog);
        }
      }
      if (locationLogs.length > 0) {
        promiseRegistration.promise.resolve(locationLogs);
        const index = this.inventoryUpdateRegistrations.indexOf(
          promiseRegistration,
        );
        this.inventoryUpdateRegistrations.splice(index, 1);
      }
    }
  }

  pushLocationLog(updatedLocationLog: LocationLog) {
    const index = _.findIndex(this.locationLogs, { id: updatedLocationLog.id });
    if (index === -1) {
      this.locationLogs.push(updatedLocationLog);
    } else {
      this.locationLogs[index] = updatedLocationLog;
    }
    this.notifyInventoryRegistrations();
  }

  async createLocationLog(
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
    this.pushLocationLog(locationLog);
    return locationLog;
  }

  async updateLocationLog(
    locationLog: LocationLog,
    status,
    message,
  ): Promise<any> {
    locationLog.status = status;
    locationLog.message = message;
    locationLog = await this.entityManager.save(locationLog);
    this.pushLocationLog(locationLog);
    return locationLog;
  }

  async updateLocationLogProductCount(locationLog: LocationLog, count: number) {
    locationLog.productCount = count;
    locationLog = await this.entityManager.save(locationLog);
    this.pushLocationLog(locationLog);
  }

  async createProductLog(locationLog: LocationLog, product: Product) {
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

@Injectable()
export class MjfreewayInventoryService {
  private inventoryLog: InventoryLog;
  private logger: LoggerService = new GreenDirectLogger('MjfreewayInventoryService');

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly httpService: HttpService,
  ) {
    this.inventoryLog = new InventoryLog(entityManager);
  }

  registerInventoryUpdate(promiseRegistration: PromiseRegistration) {
    this.inventoryLog.registerInventoryUpdate(promiseRegistration);
  }

  async synchronizeInventory(userId: number) {
    const locations = await this.getLocations();
    let counter = 1 ;
    for (const location of locations) {
      this.logger.log(`synchronizeInventory ${counter++} of ${locations.length} on location id ${location.id}`);
      const locationLog = await this.inventoryLog.createLocationLog(
        userId,
        location,
      );
      if (!location.organization.posConfig) {
        await this.inventoryLog.updateLocationLog(
          locationLog,
          LocationLogStatus.failed,
          'No POS Configuration specified',
        );
        continue;
      }
      await this.synchronizeLocationInventory(locationLog, location);
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
      // First, remove all inventory and then fetch from MJ Freeway to sync all inventory
      await this.removeAllLocationInventory(
        locationLog.user.id,
        transactionalEntityManager,
        location,
      ); // mark all products as deleted
      let count = 0;
      let page = 1;
      let inventory;
      do {
        inventory = await this.getRemoteInventory(locationLog, location, page);
        if (inventory.length === 0) {
          this.logger.log(`No inventory found for location ${location.id}`);
          return this.inventoryLog.updateLocationLog(
            locationLog,
            LocationLogStatus.failed,
            `MJ Freeway API returned 0 inventory for this location.`,
          );
        }
        this.logger.log(`Page ${inventory.current_page}/${inventory.last_page} has item count ${inventory.total}`);
        await this.inventoryLog.updateLocationLog(
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
          await this.inventoryLog.updateLocationLogProductCount(
            locationLog,
            count,
          );
        }
        page++; // MJ Freeway API is paginated
      } while (inventory.current_page < inventory.last_page);
      // TODO Shouldn't this be <= so the last page is retrieved...?
    });

    return this.inventoryLog.updateLocationLog(
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
    product.strainId = productInfo.strain_id;
    product.strainName = productInfo.strain_name;
    product.pricingType = productInfo.pricing_type;
    product.deleted = !productInfo.available_online; // hide items that are not available for online
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

    if (productInfo.primary_image_urls) {
      for (const imageInfo of productInfo.primary_image_urls) {
        const image = new ProductImage();
        image.product = product;
        image.size = imageInfo.size;
        image.url = imageInfo.url;
        image.createdBy = locationLog.user.id;
        image.modifiedBy = locationLog.user.id;
        await this.upsertProductImage(entityManager, image);
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

  async upsertProductImage(
    transactionalEntityManager: EntityManager,
    productImage: ProductImage,
  ): Promise<ProductImage> {
    const existingImage = await transactionalEntityManager
      .createQueryBuilder(ProductImage, 'image')
      .select()
      .where('product_id = :productId AND size = :size', {
        productId: productImage.product.id,
        size: productImage.size,
      })
      .getOne();
    if (existingImage) {
      productImage.id = existingImage.id;
      delete productImage.createdBy;
    }
    return transactionalEntityManager.save(productImage);
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
      .andWhere('organization.pos = :pos', { pos: 'mjfreeway' })
      .getMany();
  }

  async getRemoteInventory(
    locationLog: LocationLog,
    location: Location,
    page: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const apiPath = `${BASE_URL}/catalog?available_online=1&page=${page}`;
      await this.inventoryLog.updateLocationLog(
        locationLog,
        LocationLogStatus.startedRemoteInventory,
        `getting remote inventory for '${location.name}'; id: ${location.id}`,
      );
      this.httpService.get(apiPath, this.getHttpConfig(location)).subscribe(
        async response => {
          await this.inventoryLog.updateLocationLog(
            locationLog,
            LocationLogStatus.completedRemoteInventory,
            `received remote inventory of ${response.data.length} products.`,
          );
          resolve(response.data);
        },
        async error => {
          error = this.getHttpError(error, `getRemoteInventory() ${apiPath}`);
          await this.inventoryLog.updateLocationLog(
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
   * @param message
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
      baseURL: BASE_URL,
      headers: {
        ...httpConfig.headers,
        'Content-Type': 'application/json',
        'x-mjf-api-key': posConfig.apiKey,
        'x-mjf-organization-id': location.organization.posId,
        'x-mjf-facility-id': location.posId,
        'x-mjf-user-id': posConfig.userId,
      },
    };
  }
}
