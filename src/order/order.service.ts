import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable, LoggerService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';
import * as _ from 'lodash';
import { Repository, UpdateResult } from 'typeorm';

import { Environments, isNonProduction, isProductionEnv } from '../app.service';
import {
  Coupon,
  DiscountApplication,
  DiscountType,
} from '../entities/coupon.entity';
import { Delivery } from '../entities/delivery.entity';
import { Location } from '../entities/location.entity';
import { OrderCoupon } from '../entities/order-coupon.entity';
import { OrderHistory } from '../entities/order-history.entity';
import { OrderProduct } from '../entities/order-product.entity';
import { OrderTax } from '../entities/order-tax.entity';
import { Order } from '../entities/order.entity';
import { OrganizationPos, Organization } from '../entities/organization.entity';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/product.entity';
import { UserAddress } from '../entities/user-address.entity';
import { User } from '../entities/user.entity';
import { GDExpectedException } from '../gd-expected.exception';
import { LocationOrderStatsDto } from '../location/dto/location-order-stats.dto';
import {
  PricingType,
  LocationSearchDto,
} from '../location/dto/location-search.dto';
import { LocationExceptions } from '../location/location.exceptions';
import { LocationService } from '../location/location.service';
import { MessageService } from '../message/message.service';
import {
  EmailNotification,
  NotificationService,
  TextMessageNotification,
} from '../notification/notification.service';
import { OrderProductUpdateQuantityDto } from '../order/dto/order-product-update.dto';
import { ProductService } from '../product/product.service';
import { OrderReportParams } from '../reports/params/order-params.interface';
import { RoleEnum } from '../roles/roles.enum';
import { BiotrackOrderService } from '../synchronize/biotrack/biotrack-order.service';
import { BiotrackUserService } from '../synchronize/biotrack/biotrack-user.service';
import { MjfreewayUserService } from '../synchronize/mjfreeway/mjfreeway-user.service';
import {
  MjfreewayOrderService,
  PosInfo,
} from '../synchronize/mjfreeway/mjfreeway-order.service';
import { UserExceptions } from '../user/user.exceptions';
import { UserService } from '../user/user.service';
import { OrderCountSummaryDto } from './dto/order-count.dto';
import {
  OrderHistoryUpdateDto,
  OrderSearchDto,
  OrderUpdateDeliveryDto,
  IdentificationParams,
} from './dto/order-search.dto';
import { OrderCouponService } from './order-coupon/order-coupon.service';
import { FulfillmentMethod, OrderStatus } from './order-status.enum';
import { OrderViewType } from './order-view-type.enum';
import { OrderExceptions, EMPTY_PRICING } from './order.exceptions';
import {GreenDirectLogger} from '../greendirect-logger';
import { UserIdentificationService } from '../user-identification/user.identification.service';

const { DEV, TEST } = Environments;
const DEFAULT_WEIGHT = '1g';
const DEFAULT_PATIENT_DELIVERY_FEE = 15.0;

/**
 * Face value %,  divide by 100 to use
 * Probably be set as database table in future
 */
export const TaxSetup = {
  stateTaxPercent: 10.5,
  muniTaxPercent: 1,
};

export const correctFloat = (num: number, precision: number = 2) => {
  return parseFloat(num.toFixed(precision));
};

export const weightProductName = (product: Product) =>
  PricingType.Weight === product.pricingType
    ? product.name + ' (' + DEFAULT_WEIGHT + ')'
    : product.name;

export enum SynchronizeAction {
  submit = 'submit',
  cancel = 'cancel',
  status = 'status',
}
@Injectable()
export class OrderService {
  private logger: LoggerService = new GreenDirectLogger('OrderService');

  constructor(
    @InjectRepository(Order)
    protected readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderHistory)
    protected readonly orderHistoryRepository: Repository<OrderHistory>,
    @InjectRepository(OrderProduct)
    protected readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(OrderTax)
    protected readonly orderTaxRepository: Repository<OrderTax>,
    @InjectRepository(Location)
    protected readonly locationRepository: Repository<Location>,
    @InjectRepository(User) protected readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
    private readonly orderCouponService: OrderCouponService,
    private readonly productService: ProductService,
    private readonly userService: UserService,
    private readonly userIdentificationService: UserIdentificationService,
    @Inject(forwardRef(() => LocationService))
    private readonly locationService: LocationService,
    @Inject(forwardRef(() => BiotrackOrderService))
    private readonly biotrackOrderService: BiotrackOrderService,
    @Inject(forwardRef(() => BiotrackUserService))
    private readonly biotrackUserService: BiotrackUserService,
    @Inject(forwardRef(() => MjfreewayUserService))
    private readonly mjfreewayUserService: MjfreewayUserService,
    @Inject(forwardRef(() => MjfreewayOrderService))
    private readonly mjfreewayOrderService: MjfreewayOrderService,
  ) {}

  public async createOrderHistory(
    userId: number,
    orderId: number,
    status: OrderStatus,
  ) {
    const orderHistory = new OrderHistory();
    orderHistory.order = new Order();
    orderHistory.order.id = orderId;
    orderHistory.orderStatus = status;
    orderHistory.createdBy = userId;
    await this.orderHistoryRepository.save(orderHistory);
  }

  public async findWithFilter(
    user: User,
    search?: string,
    status?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
    locationId?: number,
    includeDeleted?: boolean,
  ): Promise<[OrderSearchDto[], number]> {
    let rawMany = null,
      count = 0;
    const userId = user.id;
    const filter = '%' + (search || '') + '%';
    // const order_status = status || '';
    const offset = page * limit;
    try {
      const query = this.orderRepository
        .createQueryBuilder('order')
        .select([
          'order.id as id',
          'order.posId as pos_id',
          'location.name as "locationName"',
          'user.patientNumber as "patientNumber"',
          'user.mobileNumber as "mobileNumber"',
          'user.firstName as "firstName"',
          'user.lastName as "lastName"',
          'user.id as "userId"',
          'order.orderStatus as "orderStatus"',
          'order.isSubmitted as "isSubmitted"',
          `order.submittedDate AT TIME ZONE 'UTC' as "submittedDate"`,
          'products.name as description',
          'products.total as "totalPrice"',
          'products.count as "productCount"',
          'products.totalWeight as "productTotalWeight"',
          'images.url as "imageUrl"',
          `order.modified AT TIME ZONE 'UTC' as modified`,
          'order.isDelivery as "isDelivery"',
          'order.orderReady as "orderReady"',
        ])
        .leftJoin('order.user', 'user')
        .leftJoin('order.location', 'location')
        .leftJoin(
          subQuery => {
            return subQuery
              .select([
                'order_id as order_id',
                '(ARRAY_AGG(product_id order by name))[1] as product_id',
                'SUM(price * quantity)::float as "total"',
                'SUM(quantity * sold_weight)::float as totalWeight',
                `STRING_AGG(name, ', ' order by name) as name`,
                'COUNT(product_id)::float as "count"',
              ])
              .from(OrderProduct, null)
              .where('quantity > 0')
              .groupBy('order_id');
          },
          'products',
          'products.order_id = order.id',
        )
        .leftJoin(
          subQuery => {
            return subQuery
              .select([
                'min(id) as id',
                'product_id as product_id',
                '(ARRAY_AGG(url order by id))[1] as url',
              ])
              .from(ProductImage, 'images')
              .groupBy('product_id')
              .orderBy('id');
          },
          'images',
          'images.product_id = products.product_id',
        )
        .where('products.count > 0 AND order.orderStatus != :closed ', {
          closed: OrderStatus.CLOSED,
        });

      // skip empty carts
      if (status !== 'All' || '') {
        // filter own orders by status
        if (status === 'Submitted')
          query.andWhere('order.orderStatus = :status', {
            status: OrderStatus.SUBMITTED,
          });
        if (status === 'Open')
          query.andWhere('order.orderStatus = :status', {
            status: OrderStatus.OPEN,
          });
        if (status === 'Cancelled')
          query.andWhere('order.orderStatus = :status', {
            status: OrderStatus.CANCELLED,
          });
      }
      if (!includeDeleted) {
        // filter own orders
        query.andWhere('order.user_id = :userId', { userId });
      }
      if (locationId) {
        query.andWhere('order.location_id = :locationId', { locationId });
      }
      if (search) {
        // Search by names
        query.andWhere(
          `(location.name ILIKE :filter OR
        user.firstName ILIKE :filter OR
        user.lastName ILIKE :filter OR
        user.patientNumber ILIKE :filter OR
        order.orderStatus ILIKE :filter OR
        order.fullfillmentMethod ILIKE :filter)`,
          { filter },
        );
        if (!isNaN(Number(search))) {
          // Search by order id
          query.orWhereInIds([{ id: Number(search) }]);
        }
      }

      count = await query.getCount();
      query.limit(limit).offset(offset);
      if (order) {
        query.orderBy(order);
      } else {
        query.orderBy('order.created', 'DESC');
      }
      rawMany = await query.getRawMany();
    } catch (error) {
      throw error;
    }
    return new Promise<[OrderSearchDto[], number]>(resolve => {
      resolve([rawMany, count]);
    });
  }

  public async getOrdersByStatus(
    pos: OrganizationPos,
    orderStatus: OrderStatus,
  ): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.user', 'user')
      .innerJoinAndSelect('order.location', 'location')
      .innerJoinAndSelect('location.organization', 'organization')
      .where('"organization"."pos" = :pos', { pos })
      .andWhere('"order"."order_status" = :orderStatus ', { orderStatus })
      .orderBy('order.id', 'DESC')
      .limit(150)
      .getMany();
  }

  // TODO The following method name is idiotic.  it should be getOrderByIdAndPos().  It also should only return one row.
  public async getOrdersByStatusCustom(
    pos: OrganizationPos,
    orderId,
  ): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.user', 'user')
      .innerJoinAndSelect('order.location', 'location')
      .innerJoinAndSelect('location.organization', 'organization')
      .where('"organization"."pos" = :pos', { pos })
      .andWhere('order.id = ' + orderId)
      .getMany();
  }

  public async getOrdersByStatusCustomUser(
    pos: OrganizationPos,
    userId,
  ): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.user', 'user')
      .innerJoinAndSelect('order.location', 'location')
      .innerJoinAndSelect('location.organization', 'organization')
      .where('"organization"."pos" = :pos', { pos })
      .andWhere('order.user_id = ' + userId)
      .andWhere('order.submittedDate > :start_at', {
        start_at: '2021-01-01 22:24:15.076709',
      })
      .orderBy('order.id', 'DESC')
      .limit(10)
      .getMany();
  }

  public async getOrdersByStatusCustomBulk(
    pos: OrganizationPos,
    sDate,
  ): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.user', 'user')
      .innerJoinAndSelect('order.location', 'location')
      .innerJoinAndSelect('location.organization', 'organization')
      .where('"organization"."pos" = :pos', { pos })
      .andWhere('order.submittedDate > :start_at', {
        start_at: sDate + ' 00:00:00.076709',
      })
      .andWhere('order.submittedDate < :end_at', {
        end_at: sDate + ' 23:59:59.076709',
      })
      .orderBy('order.id', 'DESC')
      .limit(10)
      .getMany();
  }

  public async create(order: Order): Promise<Order> {
    let result = null;
    delete order.id;
    order.orderType = 'sales';
    order.orderSource = 'green_direct';
    order.orderStatus = OrderStatus.OPEN;
    if (!order.fullfillmentMethod) {
      order.fullfillmentMethod = FulfillmentMethod.PICKUP;
    }
    try {
      result = await this.orderRepository.save(order);
      await this.createOrderHistory(order.user.id, result.id, OrderStatus.OPEN);
    } catch (error) {
      throw error;
    }
    return new Promise<Order>(resolve => resolve(result));
  }

  public async getCart(userId: number) {
    let cart: any = null;
    try {
      const query = this.orderRepository
        .createQueryBuilder('order')
        .innerJoinAndSelect('order.user', 'user')
        .innerJoinAndSelect('order.location', 'location')
        .leftJoinAndSelect('location.state', 'state')
        .leftJoinAndSelect(
          'order.products',
          'order_products',
          'order_products.quantity > 0',
        )
        .leftJoinAndSelect('order_products.product', 'product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect(
          'pricing.weightPrices',
          'weightPrices',
          `weightPrices.deleted = false`,
        )
        .leftJoinAndSelect(
          'order_products.productPricingWeight',
          'pricing_weight',
        )
        .leftJoinAndSelect('order.orderTax', 'tax')
        .leftJoinAndSelect(
          'order.coupons',
          'orderCoupons',
          `(orderCoupons.deleted = false
           AND orderCoupons.applied = true)`,
        )
        .leftJoinAndSelect(
          'orderCoupons.coupon',
          'coupon',
          'coupon.deleted = false',
        )
        .leftJoinAndSelect(
          'coupon.couponLocations',
          'couponLocations',
          'couponLocations.deleted = false',
        )
        .leftJoinAndSelect(
          'coupon.limit',
          'couponLimit',
          'couponLimit.deleted = false',
        )
        .leftJoinAndSelect(
          'couponLimit.categories',
          'couponLimitCategories',
          'couponLimitCategories.deleted = false',
        )
        .leftJoinAndSelect('order.deliveryState', 'deliveryState')
        .where('order.user_id = :userId AND order_status = :orderStatus', {
          userId,
          orderStatus: OrderStatus.OPEN,
        })
        .orderBy({
          'order_products.name': 'ASC',
          'coupon.isAutoApply': 'DESC',
        });
      cart = await query.getOne();

      // get computed columns
      if (cart && cart.id) {
        const productsSummary = await this.orderProductRepository
          .createQueryBuilder('order_product')
          .select('SUM(price * quantity)::float as "totalPrice"')
          .select('SUM(quantity * sold_weight)::float as "totalWeight"')
          .where('order_product.order_id = ' + cart.id)
          .getRawOne();
        cart.totalPrice = productsSummary.totalPrice;
        cart.totalWeight = productsSummary.totalWeight;
        if (cart.location) {
          cart.location = await this.locationService.findById(
            cart.location.id,
            true,
          );
        }
      }
    } catch (error) {
      throw error;
    }
    return new Promise<Order>(resolve => {
      resolve(cart);
    });
  }

  public async getOrder(
    orderId: number,
    userId: number,
    allowNonOwner?: boolean,
  ): Promise<Order> {
    let order: any = null;
    try {
      const query = this.orderRepository
        .createQueryBuilder('order')
        .innerJoinAndSelect('order.user', 'user')
        .innerJoinAndSelect('order.location', 'location')
        .leftJoinAndSelect(
          'user.identifications',
          'identification',
          'identification.location_id = location.id',
        )
        .leftJoinAndSelect('location.state', 'state')
        .leftJoinAndSelect(
          'order.products',
          'order_products',
          'order_products.quantity > 0',
        )
        .leftJoinAndSelect('order_products.product', 'product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect(
          'pricing.weightPrices',
          'weightPrices',
          `weightPrices.deleted = false`,
        )
        .leftJoinAndSelect(
          'order_products.productPricingWeight',
          'pricing_weight',
        )
        .leftJoinAndSelect('order.orderTax', 'tax')
        .leftJoinAndSelect(
          'order.coupons',
          'orderCoupons',
          `(orderCoupons.deleted = false
           AND orderCoupons.applied = true)`,
        )
        .leftJoinAndSelect('orderCoupons.coupon', 'coupon')
        .leftJoinAndSelect(
          'coupon.couponLocations',
          'couponLocations',
          'couponLocations.deleted = false',
        )
        .leftJoinAndSelect(
          'coupon.limit',
          'couponLimit',
          'couponLimit.deleted = false',
        )
        .leftJoinAndSelect(
          'couponLimit.categories',
          'couponLimitCategories',
          'couponLimitCategories.deleted = false',
        )
        .leftJoinAndSelect('order.history', 'history')
        .leftJoinAndSelect('order.deliveryState', 'deliveryState')
        .where('order.id = :orderId', { orderId })
        .orderBy({
          'order_products.name': 'ASC',
          'coupon.isAutoApply': 'DESC',
          'history.created': 'DESC',
        });

      // filter by own or validate
      if (!allowNonOwner) {
        // filter own orders
        query.andWhere('order.user_id = :userId', { userId });
      }
      order = await query.getOne();

      // get computed columns
      if (order && order.id) {
        const productsSummary = await this.orderProductRepository
          .createQueryBuilder('order_product')
          .select('SUM(price * quantity)::float as "totalPrice"')
          .where('order_product.order_id = ' + order.id)
          .getRawOne();
        order.totalPrice = productsSummary.totalPrice;
        if (order.location) {
          order.location = await this.locationService.findById(
            order.location.id,
            true,
            true, // Select all notification mobile no's
          );
        }
      }
    } catch (error) {
      throw error;
    }
    return new Promise<Order>(resolve => resolve(order as Order));
  }

  private checkCart(cart: Order, newLocation: Location) {
    try {
      if (cart && cart.products.length > 0 && newLocation) {
        GDExpectedException.try(OrderExceptions.invalidLocation, {
          cartLocation: cart.location,
          productLocation: newLocation,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  private checkProduct(product: Product) {
    try {
      const {
        productNotFound,
        productHasNoPrice,
        outOfStockProductToCart,
      } = OrderExceptions;
      GDExpectedException.try(productNotFound, product);
      GDExpectedException.try(productHasNoPrice, product);
      GDExpectedException.try(outOfStockProductToCart, product);
    } catch (error) {
      throw error;
    }
  }

  private async createOrderIfNeeded(
    order: Order,
    userId: number,
    location: Location,
  ): Promise<Order> {
    let result = order;
    // if order has no existing product and if product location was changed
    if (
      order &&
      order.products.length === 0 &&
      order.location.id !== location.id
    ) {
      await this.closeOrder(order.id, userId);
      order = null; // create new order after closing existing order
    }
    if (!order) {
      // If no current open order, then create one
      order = new Order();
      order.user = new User();
      order.user.id = userId;
      order.location = location;
      try {
        result = await this.create(order);
      } catch (error) {
        throw error;
      }
    }
    return new Promise<Order>(resolve => resolve(result));
  }

  public async addProductToCart(
    userId: number,
    productId: number,
  ): Promise<OrderProduct> {
    let newOrderProduct = null;
    try {
      const location = await this.productService.getLocationForProduct(
        productId,
      );
      let order = await this.getCart(userId);
      this.checkCart(order, location);
      order = await this.createOrderIfNeeded(order, userId, location);
      newOrderProduct = await this.addProduct(order.id, productId, userId);
      await this.refreshSaveOrderTotals(order.id, userId);
    } catch (error) {
      throw error;
    }
    return new Promise<OrderProduct>(resolve => resolve(newOrderProduct));
  }

  public async addProductWeightToCart(
    userId: number,
    productPricingWeightId: number,
  ): Promise<OrderProduct> {
    let result = null;
    try {
      const location = await this.productService.getLocationForProductWeight(
        productPricingWeightId,
      );
      let order = await this.getCart(userId);
      this.checkCart(order, location);
      order = await this.createOrderIfNeeded(order, userId, location);
      result = await this.addProductWeight(
        order.id,
        productPricingWeightId,
        userId,
      );
      await this.refreshSaveOrderTotals(order.id, userId);
    } catch (error) {
      throw error;
    }
    return new Promise<OrderProduct>(resolve => resolve(result));
  }

  public async addProduct(
    orderId: number,
    productId: number,
    createdBy: number,
    quantity: number = 1,
  ): Promise<OrderProduct> {
    /*
     IMPORTANT: This method also handles weight types that have no weight prices,
     defaulting to unit price
    */
    let result = null;
    try {
      const product = await this.productService.findById(
        productId,
        null,
        null,
        null,
        true,
      );
      this.checkProduct(product); // check product contraints
      let orderProduct = await this.getOrderProduct(orderId, productId, null);
      if (orderProduct) {
        // product already exists in order so increment quantity
        orderProduct.quantity++;
        GDExpectedException.try(
          OrderExceptions.exceededAllowedQuantity,
          orderProduct,
        );
        await this.updateProductQuantity(
          orderProduct.id,
          orderProduct.quantity,
          createdBy,
        );
        result = orderProduct;
      } else {
        // secondary check for pricing if uncaught by checkProduct()
        const hasValidPricing = !OrderExceptions.productHasNoPrice.failCondition(
          product,
        );
        orderProduct = new OrderProduct();
        orderProduct.order = new Order();
        orderProduct.order.id = orderId;
        orderProduct.product = product;
        // Use the default name for weight-priced items missing weight prices
        orderProduct.name = weightProductName(product);

        orderProduct.price = hasValidPricing ? product.pricing.price : null;
        orderProduct.quantity = hasValidPricing ? quantity : 0; // don't allow buying
        orderProduct.createdBy = createdBy;
        orderProduct.modifiedBy = createdBy;
        result = await this.orderProductRepository.save(orderProduct);
      }
    } catch (error) {
      throw error;
    }
    return new Promise<OrderProduct>(resolve => resolve(result));
  }

  public async addProductWeight(
    orderId: number,
    productPricingWeightId: number,
    createdBy: number,
    quantity: number = 1,
  ): Promise<OrderProduct> {
    let result = null;
    try {
      const product = await this.productService.getProductForWeight(
        productPricingWeightId,
      );
      GDExpectedException.try(OrderExceptions.outOfStockProductToCart, product);
      GDExpectedException.try(OrderExceptions.productNotFound, product);

      let orderProduct = await this.getOrderProduct(
        orderId,
        product.id,
        productPricingWeightId,
      );
      if (orderProduct) {
        // product already exists in order so increment quantity
        orderProduct.quantity++;
        GDExpectedException.try(
          OrderExceptions.exceededAllowedQuantity,
          orderProduct,
        );
        await this.updateProductQuantity(
          orderProduct.id,
          orderProduct.quantity,
          createdBy,
        );
        result = orderProduct;
      } else {
        // Get product pricing weight
        const pricingWeight = _.find(product.pricing.weightPrices, {
          id: productPricingWeightId,
        });

        // Setup OrderProduct object
        orderProduct = new OrderProduct();
        orderProduct.order = new Order();
        orderProduct.order.id = orderId;
        orderProduct.name = product.name + ' (' + pricingWeight.name + ')';
        orderProduct.product = product;
        orderProduct.productPricingWeight = pricingWeight;
        orderProduct.soldWeight = parseFloat(
          pricingWeight.name.replace('g', ''),
        );
        orderProduct.soldWeightUnit = 'GR';
        orderProduct.price = pricingWeight.price;
        orderProduct.quantity = quantity;
        orderProduct.createdBy = createdBy;
        orderProduct.modifiedBy = createdBy;
        result = await this.orderProductRepository.save(orderProduct);
      }
    } catch (error) {
      throw error;
    }
    return new Promise<OrderProduct>(resolve => resolve(result));
  }

  public async refreshOrderProduct(userId: number, orderProductId: number) {
    const orderProduct = await this.getOrderProductById(orderProductId);

    // Note: productPricingWeight is a JOIN, thus is always latest, like product.
    // however it refers to pricing weight id DURING add to cart - UNIT-type has no productPricingWeight
    // if product is toggled from UNIT to WEIGHT (we'll default to 1g weight but using UNIT price).
    const { order, product, productPricingWeight, quantity } = orderProduct;
    const { pricingType, pricing = null } = product;
    const { weightPrices } = pricing || EMPTY_PRICING;
    const { id: orderId } = order;

    const { productNotAvailable } = OrderExceptions;
    // ? Option 1: Just prevent updating cart. User should remove the stale item manually.
    GDExpectedException.try(productNotAvailable, {
      product,
      productPricingWeight,
    });
    // ? Option 2: auto-removal of cart item if product is no longer available. Modify the exception message if using this.
    // if (productNotAvailable.failCondition({ product, productPricingWeight })) {
    //   await this.removeProductFromOrder(orderId, orderProductId, userId);
    //   GDExpectedException.throw(productNotAvailable);
    // }

    // Then, unjoin from its order so that we can re-add the product fresh
    const DONT_REUSE = false;
    await this.removeProductFromOrder(
      orderId,
      orderProductId,
      userId,
      DONT_REUSE,
    );

    const isByWeight =
      pricingType === PricingType.Weight &&
      !_.isEmpty(productPricingWeight) &&
      !_.isEmpty(weightPrices);
    const newOrderProduct = isByWeight
      ? await this.addProductWeight(
          orderId,
          productPricingWeight.id,
          userId,
          quantity,
        )
      : await this.addProduct(orderId, product.id, userId, quantity); // method covers defaulting to 1g
    return newOrderProduct;
  }

  public async getOrderProduct(
    orderId: number,
    productId: number,
    productPricingWeightId: number,
  ): Promise<OrderProduct> {
    let result = null;
    try {
      let where = 'order_id = :orderId AND product_id = :productId';
      if (productPricingWeightId) {
        where += ' AND product_pricing_weight_id = :productPricingWeightId';
      }
      result = await this.orderProductRepository
        .createQueryBuilder('order_product')
        .where(where, { orderId, productId, productPricingWeightId })
        .getOne();
    } catch (error) {
      throw error;
    }
    return new Promise<OrderProduct>(resolve => resolve(result));
  }

  public async getOrderProductById(
    orderProductId: number,
  ): Promise<OrderProduct> {
    let result = null;
    try {
      const where = 'order_product.id = :orderProductId';
      result = await this.orderProductRepository
        .createQueryBuilder('order_product')
        .where(where, { orderProductId })
        .leftJoinAndSelect('order_product.product', 'product')
        .leftJoinAndSelect('order_product.order', 'order')
        .leftJoinAndSelect(
          'order_product.productPricingWeight',
          'productPricingWeight',
        )
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoinAndSelect('pricing.weightPrices', 'weightPrices')
        .getOne();
    } catch (error) {
      throw error;
    }
    return result;
  }

  public async updateProductQuantity(
    orderProductId: number,
    quantity: number,
    userId: number,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      result = await this.orderProductRepository
        .createQueryBuilder()
        .update(OrderProduct)
        .set({ quantity, modifiedBy: userId })
        .where('id = :orderProductId', { orderProductId })
        .execute();
      const cart = await this.getCart(userId);
      await this.refreshSaveOrderTotals(cart.id, userId);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  public async removeProductFromOrder(
    orderId: number,
    orderProductId: number,
    userId: number,
    allowReuseRecord = false,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      if (allowReuseRecord) {
        result = await this.orderProductRepository
          .createQueryBuilder()
          .update(OrderProduct)
          .set({ quantity: 0, modifiedBy: userId })
          .where('order_id = :orderId AND id = :orderProductId', {
            orderId,
            orderProductId,
          })
          .execute();
      } else {
        // diassociate the order from this orderProduct.
        // when re-adding the product to cart later, it will insert a new record.
        result = await this.orderProductRepository.update(
          { id: orderProductId },
          { order: null },
        );
      }
      await this.refreshSaveOrderTotals(orderId, userId);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  public async cancelOrder(
    orderId: number,
    userId: number,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      await this.synchronizeOrder(orderId, userId, SynchronizeAction.cancel);
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ orderStatus: OrderStatus.CANCELLED, modifiedBy: userId })
        .where('id = :orderId', { orderId })
        .execute();
      await this.createOrderHistory(userId, orderId, OrderStatus.CANCELLED);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  public composeCancelSMS(
    orderId: number,
    mobileNumber: string,
  ): TextMessageNotification {
    const sms: TextMessageNotification = {
      phoneNumber: mobileNumber,
      message:
        'Your GreenDirect order has been cancelled. We hope to see you again soon.',
    };
    return sms;
  }

  /**
   * If validations need to be run for the order being submitted,
   * call orderService.checkSubmit() first before this method
   */
  public async submitOrder(
    orderId: number,
    userId: number,
    request?,
  ): Promise<Order> {
    const { SUBMITTED } = OrderStatus;
    try {
      await this.refreshSaveOrderTotals(orderId, userId);
      // K@m35h uncommented
      const remoteOrder = await this.synchronizeOrder(
        orderId,
        userId,
        SynchronizeAction.submit,
      );
      await this.orderRepository.query(
        `UPDATE public.order SET pos_id = $1, is_submitted = true, order_status = $2, submitted_date = CURRENT_TIMESTAMP,
        modified_by = $3, modified = CURRENT_TIMESTAMP, pos_order_id = $5
        WHERE id = $4`,
        [
          remoteOrder ? remoteOrder.id : null,
          SUBMITTED,
          userId,
          orderId,
          remoteOrder ? remoteOrder.name : null,
        ],
        // [null, SUBMITTED, userId, orderId],
      );
      await this.createOrderHistory(userId, orderId, OrderStatus.SUBMITTED);
      // get order for consumer
      const order = await this.getOrder(orderId, userId);
      // Allow organization subscription. DEV/TEST is allowed since localstack endpoint is used.
      // Commented out until localstack is broken
      // if (isProductionEnv({ allow: [DEV, TEST] })) {
      if (isProductionEnv()) {
        // subscribe user to company text marketing
        if (order.user.isSubscribedToMarketing) {
          await this.messageService.subscribeToTextMessageMarketing(
            order.user.id,
            order.user.mobileNumber,
            order.location.organization.id,
          );
        }
      }
      // get order for location notification
      await this.sendOrderSubmitNotifications(order, request);
      
      return order;
    } catch (error) {
      throw error;
    }
  }

  public async getPosInfo(orderId: number): Promise<PosInfo> {
    return this.orderRepository
      .createQueryBuilder('order')
      .select([
        'order.posId as "orderPosId"',
        'organization.pos_id as "organizationPosId"',
        'organization.pos_config as "posConfig"',
        'organization.pos as "pos"',
        'location.id as "locationId"',
        'location.pos_id as "locationPosId"',
      ])
      .innerJoin('order.location', 'location')
      .innerJoin('location.organization', 'organization')
      .where('order.id = :orderId', { orderId })
      .getRawOne();
  }

  public async Todaydeliverdetails(
    user: User,
    search?: string,
    status?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
    locationId?: number,
    includeDeleted?: boolean,
  ): Promise<[OrderSearchDto[], number]> {
    let rawMany = null,
      count = 0;
    const userId = user.id;
    const filter = '%' + (search || '') + '%';
    // const order_status = status || '';
    const offset = page * limit;
    try {
      const query = this.orderRepository
        .createQueryBuilder('order')
        .select([
          'order.id as id',
          'order.posId as posid',
          'order.pos_order_id as pos_order_id',
          'order.orderTotal as order_total',
          'order.taxTotal as tax_total',
          'order.deliveryPatientFee as delivery_fee_total',
          'location.id as "locationID"',
          'location.name as "locationName"',
          'user.patientNumber as "patientNumber"',
          'user.mobileNumber as "mobileNumber"',
          'user.firstName as "firstName"',
          'user.lastName as "lastName"',
          'user.id as "userId"',
          'order.orderStatus as "orderStatus"',
          'order.isSubmitted as "isSubmitted"',
          `order.submittedDate AT TIME ZONE 'UTC' as "submittedDate"`,
          'products.name as description',
          'products.total as "totalPrice"',
          'products.count as "productCount"',
          'products.totalWeight as "productTotalWeight"',
          'images.url as "imageUrl"',
          `order.modified AT TIME ZONE 'UTC' as modified`,
          'order.isDelivery as "isDelivery"',
          'order.deliveryNickname as "deliveryNickname"',
          'order.deliveryAddressReferenceId as "order_ready"',
          'order.deliveryAddressLine1 as "deliveryAddressLine1"',
          'order.deliveryAddressLine2 as "deliveryAddressLine2"',
          'order.deliveryCity as "deliveryCity"',
          'order.deliveryState as "deliveryState"',
          'order.deliveryPostalCode as "deliveryPostalCode"',
          'order.deliveryInstruction as "deliveryInstruction"',
          'order.deliveryTimeSlot as "deliveryTimeSlot"',
          'order.assignedTo as "assignedTo"',
          'order.driverName as "driverName"',
        ])
        .leftJoin('order.user', 'user')
        .leftJoin('order.location', 'location')
        .leftJoin(
          subQuery => {
            return subQuery
              .select([
                'order_id as order_id',
                '(ARRAY_AGG(product_id order by name))[1] as product_id',
                'SUM(price * quantity)::float as "total"',
                'SUM(quantity * sold_weight)::float as totalWeight',
                `STRING_AGG(name, ', ' order by name) as name`,
                'COUNT(product_id)::float as "count"',
              ])
              .from(OrderProduct, null)
              .where('quantity > 0')
              .groupBy('order_id');
          },
          'products',
          'products.order_id = order.id',
        )
        .leftJoin(
          subQuery => {
            return subQuery
              .select([
                'min(id) as id',
                'product_id as product_id',
                '(ARRAY_AGG(url order by id))[1] as url',
              ])
              .from(ProductImage, 'images')
              .groupBy('product_id')
              .orderBy('id');
          },
          'images',
          'images.product_id = products.product_id',
        )
        .where('products.count > 0 AND order.orderStatus != :closed ', {
          closed: OrderStatus.CLOSED,
        }); // skip empty carts
      if (status !== 'All' || '') {
        // filter own orders by status
        if (status === 'Submitted')
          query.andWhere('order.orderStatus = :status', {
            status: OrderStatus.SUBMITTED,
          });
      }
      if (!includeDeleted) {
        // filter own orders
        query.andWhere('order.user_id = :userId', { userId });
      }
      if (locationId) {
        query.andWhere('order.location_id = :locationId', { locationId });
      }
      if (search) {
        // Search by names
        query.andWhere(
          `(location.name ILIKE :filter OR
        user.firstName ILIKE :filter OR
        user.lastName ILIKE :filter OR
        user.patientNumber ILIKE :filter OR
        order.orderStatus ILIKE :filter OR
        order.fullfillmentMethod ILIKE :filter)`,
          { filter },
        );
        if (!isNaN(Number(search))) {
          // Search by order id
          query.orWhereInIds([{ id: Number(search) }]);
        }
      }

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      // K@m35h
      // query.where(`order.submittedDate  BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'`);
      query.andWhere('order.fullfillmentMethod = :status', {
        status: OrderStatus.DELIVERY,
      });

      count = await query.getCount();
      query.limit(limit).offset(offset);
      if (order) {
        query.orderBy(order);
      } else {
        query.orderBy('order.created', 'DESC');
      }
      rawMany = await query.getRawMany();
    } catch (error) {
      throw error;
    }
    return new Promise<[OrderSearchDto[], number]>(resolve => {
      resolve([rawMany, count]);
    });
  }

  public async synchronizeOrder(
    orderId: number,
    userId: number,
    action: SynchronizeAction,
  ) {
    try {
      const posInfo = await this.getPosInfo(orderId);
      posInfo.userId = userId;
      if (
        !posInfo ||
        (posInfo.posConfig && !posInfo.posConfig.enableOrderSync)
      ) {
        return; // abort order sync
      }
      switch (posInfo.pos) {
        case 'mjfreeway':
          switch (action) {
            case SynchronizeAction.submit:
              return this.mjfreewayOrderService.submitOrderCustom(
                posInfo,
                orderId,
              );
            case SynchronizeAction.cancel:
              return this.mjfreewayOrderService.cancelOrder(posInfo, orderId);
            case SynchronizeAction.status:
              return this.mjfreewayOrderService.updateOrderStatus(
                posInfo,
                orderId,
              );
          }
          break;
        case 'biotrack':
          switch (action) {
            case SynchronizeAction.submit:
              return this.biotrackOrderService.submitOrder(posInfo, orderId);
            case SynchronizeAction.cancel:
              return this.biotrackOrderService.cancelOrder(posInfo, orderId);
          }
          break;
      }
    } catch (error) {
      GDExpectedException.throw(OrderExceptions.invalidMedicalId);
    }
  }

  public async isUserInPosSystem(
    orderId: number,
    userId: number,
  ): Promise<boolean> {
    try {
      const organizationPosInfo = await this.getPosInfo(orderId);
      if (
        !organizationPosInfo ||
        !organizationPosInfo.locationPosId ||
        !organizationPosInfo.pos ||
        !organizationPosInfo.posConfig ||
        !organizationPosInfo.organizationPosId
      ) {
        // posInfo has no contents (no POS system configured).
        // So, automatically assume user is verified to skip external verify.
        return true;
      }

      // Else, check if user identification exists
      let userIdentification = await this.userIdentificationService.findActivePatientLicenseByLocation(
        userId,
        organizationPosInfo.locationId,
      );

      if (userIdentification) {
        return true;
      }

      // Else, no user-identification. Try external accounts using patientNumber.
      const user = (await this.userService.findById(userId)) as User;

      // Throw error if patientNumber has not been stored.
      try {
        GDExpectedException.try(OrderExceptions.userHasNoPatientId, user);
      } catch (error) {
        // fail silently but trigger ReminderDialog to prompt for lookup
        return false;
      }

      // Lookup the patientNumber (if not found, email and phonenumber will be manually checked in ReminderDialog)
      const { patientNumber } = user;
      const params: IdentificationParams = { patientNumber };

      organizationPosInfo.userId = userId;
      userIdentification = await this.matchPOSUserIdentification(
        params,
        organizationPosInfo,
      );
      if (userIdentification) {
        this.logger.log(
          `Create identification from order.isUserInPosSystem order ${orderId} user ${userId} ` +
            `ident ${JSON.stringify(userIdentification)}`,
        );
        if ( this.userIdentificationService.createIdentification(userIdentification) ) {
          return true;
        }
        return false;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }

  public async synchronizeUserIdentification(
    orderId: number,
    userId: number,
    identificationParams: IdentificationParams,
    posInfo?: PosInfo,
  ): Promise<boolean> {
    try {
      if (!posInfo) {
        posInfo = await this.getPosInfo(orderId);
        if (!posInfo) {
          return false; // No POS system for this location
        }
      }

      posInfo.userId = userId;
      const newUserIdentification = await this.matchPOSUserIdentification(
        identificationParams,
        posInfo,
      );

      if (newUserIdentification) {
        this.logger.log(
          'Create identification from order.synchronizeUserIdentification ' +
            `order ${orderId} user ${userId} posInfo ${JSON.stringify(
              posInfo,
            )} ident ${JSON.stringify(newUserIdentification)}`,
        );
        const userIdentification = this.userIdentificationService.createIdentification(newUserIdentification);
      }
      return false;
    } catch (error) {
      throw error;
    }
  }

  /**
   * These queries GD tables that have been synced by task runner. No external API calls here.
   * If a match is found in freeway_user or biotrack_user tables then update tables with userId
   */
  public async matchPOSUserIdentification(
    identificationParams: IdentificationParams,
    posInfo?: PosInfo,
  ) {
    let userIdentification = null;
    switch (posInfo.pos) {
      case OrganizationPos.Mjfreeway:
        userIdentification = await this.mjfreewayUserService.matchUserIdentification(
          posInfo,
          identificationParams,
        );
        break;

      case OrganizationPos.Biotrack:
        userIdentification = await this.biotrackUserService.matchUserIdentification(
          posInfo,
          identificationParams,
        );
        break;
    }
    return userIdentification;
  }

  public composeSubmitSMS(
    order: Order,
    mobileNumber: string,
  ): TextMessageNotification {
    const clientBaseUrl = this.configService.get('email.clientBaseUrl');
    const urlPath = `${clientBaseUrl}/account/orders/${order.id}`;

    let message = '';
    if (order.isDelivery) {
      message =
        'Your order has been submitted and will be delivered within the hour. ';
    } else {
      const location = order.location as LocationSearchDto;
      const organization = location.organization || ({} as Organization);
      const hoursToday = location.hoursToday || {};

      message =
        hoursToday.isOffHours &&
        organization.allowOffHours &&
        location.allowOffHours
          ? 'Your off-hours order has been submitted and will be available for pick up at your location ' +
            'within 60 minutes of regular business hours the next day and will expire in 72 hours. '
          : 'Your order has been submitted and will be ready for pick up within 15 minutes. ' +
            'If placed too late in the day your order will be ready for pickup within 60 minutes of regular business hours the following day. ' +
            'This order will expire in 72 hours. ';
    }
    message = message + `Thank you for using Green Direct. \n ${urlPath}`;

    const sms: TextMessageNotification = {
      phoneNumber: mobileNumber,
      message,
    };
    return sms;
  }

  public composeLocationNotificationSMS(
    order: Order,
    mobileNumber: string,
  ): TextMessageNotification {
    const message = order.isDelivery
      ? `An order has been submitted for delivery at ${order.location.name}.`
      : `An order has been submitted for pickup at ${order.location.name}.`;
    const sms: TextMessageNotification = {
      phoneNumber: mobileNumber,
      message,
    };
    return sms;
  }

  public composeLocationNotificationEmail(
    order: Order,
    email: string,
  ): EmailNotification {
    const clientBaseUrl = this.configService.get('email.clientBaseUrl');
    const orderMethod = order.isDelivery ? 'delivery' : 'pickup';
    return {
      from: this.configService.get('email.from'),
      to: email,
      subject: `GreenDirect order submitted for ${order.location.name}`,
      message:
        `A ${orderMethod} order has been submitted for ${order.location.name}\n\nClick the link below to view the order:\n\n` +
        `${clientBaseUrl}/admin/portal/locations/${order.location.id}/orders/${order.id}\n\n`,
    };
  }

  /**
   *
   * @param orderId
   * @param ownerId Optional: skip if you don't need to check owner rules
   */
  public async checkSubmit(orderId: number, ownerId?: number) {
    const order = await this.getOrder(orderId, ownerId, true);
    try {
      if (ownerId) {
        const user = await this.userService.findById(order.user.id);
        GDExpectedException.try(UserExceptions.userNotVerified, user);
        GDExpectedException.try(OrderExceptions.userHasNoMobileNumber, user);
      }
      const location = await this.locationService.findById(order.location.id);
      GDExpectedException.try(LocationExceptions.locationNotFound, location);
      GDExpectedException.try(OrderExceptions.locationClosed, location);

      const locationOrderPair = { order, location };
      GDExpectedException.try(
        OrderExceptions.locationHasNoDelivery,
        locationOrderPair,
      );

      GDExpectedException.try(
        OrderExceptions.orderProductMismatchFromInventory,
        order,
      );

      if (order.isDelivery) {
        GDExpectedException.try(
          OrderExceptions.userAddressRequiredForDelivery,
          order,
        );

        const runningOrder = await this.getRunningOrder(
          order.user.id,
          order.fullfillmentMethod as FulfillmentMethod,
        );
        // don't allow submitting extra Delivery Orders before current submitted one
        // has been completed or cancelled.
        GDExpectedException.try(
          OrderExceptions.hitLimitForOrderForDeliverySubmission,
          runningOrder,
        );
        // don't allow for delivery when product total is less than amount
        GDExpectedException.try(
          OrderExceptions.lessThanDeliveryAmountThreshold,
          order,
        );
      }

      GDExpectedException.try(
        OrderExceptions.outsideDeliveryHoursWindow,
        locationOrderPair,
      );
    } catch (error) {
      throw error;
    }
  }

  public async getPatients(
    locationId?: number,
    organizationId?: number,
    search?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
  ): Promise<[User[], number]> {
    const filter = '%' + (search || '') + '%';
    const offset = page * limit;
    try {
      const query = await this.userRepository
        .createQueryBuilder('user')
        .select([
          '"user".id as "id"',
          'first_name as "firstName"',
          'last_name as "lastName"',
          'email as "email"',
          '"user".modified as "modified"',
          '"user".deleted as "deleted"',
        ])
        .where('user.deleted = false')
        .innerJoin(Order, 'order', 'order.user_id = user.id')
        .leftJoin('order.location', 'location')
        .leftJoin('location.organization', 'organization')
        .groupBy('"user".id');

      /** Filters */
      if (locationId) {
        // add location id and group by it to remove duplicates
        query
          .addSelect('"order"."location_id" AS "locationId"')
          .andWhere(
            'order.location_id = :locationId AND location.deleted = false',
            { locationId },
          )
          .addGroupBy('"order".location_id');
      } else if (organizationId) {
        // add organization id and group by it to remove duplicates
        query
          .addSelect('"location"."organization_id" AS "organizationId"')
          .andWhere(
            'location.organization_id = :organizationId AND organization.deleted = false',
            { organizationId },
          )
          .addGroupBy('"location".organization_id');
      }

      if (search) {
        query.andWhere('first_name ILIKE :filter OR last_name ILIKE :filter', {
          filter,
        });
      }

      if (order) {
        query.orderBy(order);
      } else {
        query.orderBy('last_name', 'DESC');
      }
      query.limit(limit).offset(offset);

      const count = await query.getCount();
      const rawMany = await query.getRawMany();
      return [rawMany, count];
    } catch (error) {
      throw error;
    }
  }

  public async reOrderProducts(
    orderId: number,
    userId: number,
  ): Promise<Order> {
    let result = null;
    try {
      const oldOrder = await this.getOrder(orderId, userId);
      // if order not exist
      if (oldOrder) {
        let order = await this.getCart(userId);
        this.checkCart(order, oldOrder.location);
        order = await this.createOrderIfNeeded(
          order,
          userId,
          oldOrder.location,
        );
        await Promise.all(
          oldOrder.products.map(async newProduct => {
            if (!newProduct.product.isInStock) return;
            newProduct.order = order;
            const newOrderProduct = await this.getOrderProduct(
              order.id,
              newProduct.product.id,
              newProduct.productPricingWeight
                ? newProduct.productPricingWeight.id
                : null,
            );
            delete newProduct.id;
            // if product exist
            if (newOrderProduct) {
              newProduct.id = newOrderProduct.id;
              newProduct.quantity += newOrderProduct.quantity;
            }
            return await this.orderProductRepository.save(newProduct);
          }),
        );
        result = await this.getOrder(order.id, userId);
      }
    } catch (error) {
      throw error;
    }
    return new Promise<Order>(resolve => resolve(result));
  }

  public async closeOrder(
    orderId: number,
    userId: number,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ orderStatus: OrderStatus.CLOSED, modifiedBy: userId })
        .where('id = :orderId', { orderId })
        .execute();
      await this.createOrderHistory(userId, orderId, OrderStatus.CLOSED);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  public async updateOrderStatus(
    orderId: number,
    orderStatus: OrderStatus,
    userId: number,
    deliveryId?: number,
  ): Promise<UpdateResult> {
    if (!orderId && !orderStatus) return Promise.reject(null);
    let result = null;
    try {
      const order = {
        ...new Order(),
        orderStatus,
        modifiedBy: userId,
      };
      if (deliveryId) {
        order.delivery = { ...new Delivery(), id: deliveryId };
      }
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set(order)
        .where('id = :orderId', { orderId })
        .execute();
      await this.createOrderHistory(userId, orderId, orderStatus);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  // modified function to solve back orders
  public async updateOrderStatusCustom(
    orderId: number,
    orderStatus: OrderStatus,
    userId: number,
    deliveryId?: number,
  ): Promise<UpdateResult> {
    if (!orderId && !orderStatus) return Promise.reject(null);
    let result = null;
    try {
      const order = {
        ...new Order(),
        orderStatus,
        modifiedBy: userId,
      };
      if (deliveryId) {
        order.delivery = { ...new Delivery(), id: deliveryId };
      }
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set(order)
        .where('id = :orderId', { orderId })
        .execute();
      await this.createOrderHistory(userId, orderId, orderStatus);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }
  // modified function to solve back orders

  public async updateOrderStatusToCancel(
    userId: number,
    locationId: number,
  ): Promise<UpdateResult> {
    if (!locationId) return Promise.reject(null);
    let result = null;
    try {
      const order = {
        orderStatus: OrderStatus.CANCELLED,
        modifiedBy: userId,
      };
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set(order)
        .where('orderStatus = :status and location_id=:locationId', {
          status: OrderStatus.OPEN,
          locationId,
        })
        .execute();
      // await this.createOrderHistory(userId, orderId, orderStatus);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  public async CancelOpenordersOfPatient(
    userId: number,
    // locationId: number
  ): Promise<UpdateResult> {
    if (!userId) return Promise.reject(null);
    let result = null;
    try {
      const order = {
        orderStatus: OrderStatus.CANCELLED,
        modifiedBy: userId,
      };
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set(order)
        .where('orderStatus = :status and user_id=:userId', {
          status: OrderStatus.OPEN,
          userId,
        })
        .execute();
      // await this.createOrderHistory(userId, orderId, orderStatus);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  public async updateOrderReady(
    userId: number,
    orderId: number,
    orderReady: string,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      const order = {
        orderReady,
        modifiedBy: userId,
      };
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set(order)
        .where('id =:orderId ', { orderId })
        .execute();
      // await this.createOrderHistory(userId, orderId, orderStatus);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  public async updateSelectedOrderStatusToCancel(
    userId: number,
    id: number,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      const order = {
        orderStatus: OrderStatus.CANCELLED,
        modifiedBy: userId,
      };
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set(order)
        .where('id =:orderId and  orderStatus = :status', {
          orderId: id,
          status: OrderStatus.OPEN,
        })
        .execute();
      // await this.createOrderHistory(userId, orderId, orderStatus);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  public async updateSelecteddeliveryStatus(
    drivermame: string,
    driverid: number,
    id: number,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      const order = {
        driverName: drivermame,
        assignedTo: driverid,
      };
      result = await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set(order)
        .where('id =:orderId ', { orderId: id })
        .execute();
      // await this.createOrderHistory(userId, orderId, orderStatus);
    } catch (error) {
      throw error;
    }
    return new Promise<UpdateResult>(resolve => resolve(result));
  }

  // TODO: wrap this in @Transaction since it does multiple saves?
  public async refreshSaveOrderTotals(orderId: number, userId: number) {
    /**
     * Get order as admin=true (allow retrieve of any order). Make sure
     * any callers of this method are authorized properly, but here let's retrieve full details
     * regardless of user owner.
     */
    let order = await this.getOrder(orderId, userId, true);
    order.modifiedBy = userId;
    order.coupons = await this.orderCouponService.refreshOrderCoupons(order);
    const recomputedOrder = await this.computeTotals(order);
    /*
      Partially save the totals only, not the entire order w/ joins
      to prevent triggering save-cascade to orderProducts (eagerly-loaded), etc
    */
    const {
      couponTotal,
      orderTax,
      taxTotal,
      deliveryPatientFee,
      deliveryDispensaryFee,
      orderTotal,
      modifiedBy,
    } = recomputedOrder;
    await this.saveOrderTax(orderTax);
    await this.orderRepository.save({
      ...new Order(),
      id: orderId,
      couponTotal,
      orderTax,
      taxTotal,
      deliveryPatientFee,
      deliveryDispensaryFee,
      orderTotal,
      modifiedBy,
    });
    order = await this.getOrder(orderId, userId); // get fresh order entity
    return new Promise<Order>(resolve => resolve(order));
  }

  private async computeTotals(order: Order) {
    /* Product Prices x Qty */
    const prices =
      order.products && order.products.length
        ? order.products.map(p => p.price * p.quantity)
        : [0];
    const subTotal = correctFloat(
      prices.reduce((subtotal, thisPrice) => subtotal + thisPrice),
    );

    /* Coupons */
    const couponTotal = await this.applyOrderDiscounts(order, subTotal);
    // dont go past negative subtotal
    const discountedSubTotal = Math.max(0, subTotal - couponTotal);
    const hasVoidDeliveryFeeCoupon = !!order.coupons
      .filter(({ deleted, applied }) => applied && !deleted)
      .map(({ coupon }) => coupon)
      .find(
        ({ isForDelivery, isVoidDeliveryFee, deleted }) =>
          isForDelivery && isVoidDeliveryFee && !deleted,
      );

    /* Taxes - Add more taxes to TaxSetup here as needed */
    const { stateTaxPercent, muniTaxPercent } = TaxSetup;
    const orderTax: OrderTax = {
      ...(order.orderTax || new OrderTax()),
      stateTax: correctFloat(discountedSubTotal * (stateTaxPercent / 100)),
      muniTax: correctFloat(discountedSubTotal * (muniTaxPercent / 100)),
    };
    const taxTotal = correctFloat(orderTax.stateTax + orderTax.muniTax);

    /* Delivery Fees */
    // TODO remove if confirmed as obsolete
    // // * Using Percentage
    // const { deliveryFee, deliveryFeePatientPercentage } = order.location;
    // let orderPatientDeliveryFee = DEFAULT_PATIENT_DELIVERY_FEE;
    // let orderDispensaryDeliveryFee = 0.0;
    // if (deliveryFee != null && deliveryFeePatientPercentage != null) {
    //   orderPatientDeliveryFee = deliveryFee * deliveryFeePatientPercentage;
    //   orderDispensaryDeliveryFee = deliveryFee - orderPatientDeliveryFee;
    // }

    // * Temporary hard-coded delivery fees
    let deliveryPatientFee = 0;
    let deliveryDispensaryFee = 0;
    if (order.isDelivery) {
      // K@m35h old delivery conditions
      // if (discountedSubTotal <= 99) {
      //   deliveryPatientFee = 20;
      //   deliveryDispensaryFee = 5;
      // } else if (discountedSubTotal <= 149) {
      //   deliveryPatientFee = 15;
      //   deliveryDispensaryFee = 10;
      // } else if (discountedSubTotal <= 199) {
      //   deliveryPatientFee = 10;
      //   deliveryDispensaryFee = 15;
      // } else if (discountedSubTotal <= 249) {
      //   deliveryPatientFee = 5;
      //   deliveryDispensaryFee = 20;
      // } else if (discountedSubTotal >= 250) {
      //   deliveryPatientFee = 0;
      //   deliveryDispensaryFee = 25;
      // }
      // K@m35h old delivery conditions
      // new delivery brackets
      if (discountedSubTotal > 0 && discountedSubTotal <= 74) {
        deliveryPatientFee = 15;
        deliveryDispensaryFee = 0;
      } else if (discountedSubTotal >= 75 && discountedSubTotal <= 99) {
        deliveryPatientFee = 12;
        deliveryDispensaryFee = 0;
      } else if (discountedSubTotal >= 100 && discountedSubTotal <= 149) {
        deliveryPatientFee = 10;
        deliveryDispensaryFee = 0;
      } else if (discountedSubTotal >= 150 && discountedSubTotal <= 199) {
        deliveryPatientFee = 5;
        deliveryDispensaryFee = 0;
      } else if (discountedSubTotal >= 200) {
        deliveryPatientFee = 0;
        deliveryDispensaryFee = 0;
      }
      // new delivery brackets
    }
    // VoidDeliveryFee coupon
    if (hasVoidDeliveryFeeCoupon) {
      deliveryPatientFee = 0;
    }

    /* Order Total */
    // * Final Formula
    const finalOrder: Order = {
      ...order,
      couponTotal,
      orderTax,
      taxTotal,
      deliveryPatientFee,
      deliveryDispensaryFee,
      orderTotal: correctFloat(
        discountedSubTotal + taxTotal + deliveryPatientFee,
      ),
    };
    return finalOrder;
  }

  private async applyOrderDiscounts(
    order: Order,
    totalOrder: number,
  ): Promise<number> {
    const processedCoupons: OrderCoupon[] = [];
    const processCoupon = (orderCoupon: OrderCoupon, applied: boolean) => {
      orderCoupon.applied = applied;
      processedCoupons.push(orderCoupon);
    };
    const getDiscount = (
      discountType: DiscountType,
      amount: number,
      subtotal: number,
    ) => {
      if (discountType === DiscountType.Fixed) {
        return amount;
      } else {
        return subtotal * (amount / 100);
      }
    };
    const withinLimit = (products: Product[], coupon: Coupon) => {
      if (
        coupon.limit &&
        coupon.limit.categories &&
        coupon.limit.categories.length
      ) {
        const limitedCategories = coupon.limit.categories.map(
          limitCategory => limitCategory.category,
        );
        const productCategories = products.map(product => product.category);
        return !!_.intersection(limitedCategories, productCategories).length;
      } else {
        return true;
      }
    };

    const orderProducts =
      order.products && order.products.length
        ? order.products.map(orderProduct => orderProduct.product)
        : [];

    const discounts = order.coupons.reduce((sum, orderCoupon) => {
      if (orderCoupon.deleted || !orderCoupon.applied) {
        return sum; // skip processing of deleted
      }
      const coupon = orderCoupon.coupon;
      if (coupon.discountApplication === DiscountApplication.Subtotal) {
        if (withinLimit(orderProducts, coupon)) {
          processCoupon(orderCoupon, true);
          return correctFloat(
            (sum += getDiscount(
              coupon.discountType,
              coupon.discountAmount,
              totalOrder,
            )),
          );
        } else {
          processCoupon(orderCoupon, false);
          return correctFloat(sum);
        }
      } else {
        if (order.products && order.products.length) {
          const applicableItemCount = coupon.applicableItemCount || 0;
          let couponIsApplied = false;
          const lineItemDiscount = order.products.reduce(
            (discountSum, orderProduct) => {
              if (orderProduct.quantity >= applicableItemCount) {
                if (withinLimit([orderProduct.product], coupon)) {
                  couponIsApplied = true;

                  const orderProductTotal =
                    orderProduct.price * orderProduct.quantity;
                  return correctFloat(
                    (discountSum += getDiscount(
                      coupon.discountType,
                      coupon.discountAmount,
                      orderProductTotal,
                    )),
                  );
                } else {
                  return correctFloat(discountSum);
                }
              } else {
                return correctFloat(discountSum);
              }
            },
            0,
          );
          processCoupon(orderCoupon, couponIsApplied);
          return correctFloat((sum += lineItemDiscount));
        } else {
          processCoupon(orderCoupon, false);
          return correctFloat(sum);
        }
      }
    }, 0);

    if (processedCoupons.length) {
      await this.orderCouponService.saveOrderCoupons(processedCoupons);
    }

    return discounts;
  }

  private async saveOrderTax(orderTax: OrderTax, createdBy?) {
    if (!orderTax.createdBy) {
      orderTax.createdBy = createdBy;
    }
    const newOrderTax = await this.orderTaxRepository.save(orderTax);
    return newOrderTax;
  }

  public async getOrderStats(
    locationId: number,
  ): Promise<LocationOrderStatsDto> {
    const { COMPLETED } = OrderStatus;

    try {
      return this.locationRepository
        .createQueryBuilder('location')
        .select([
          'location.id as "locationId"',
          'COUNT(orders.id) as "orderCount"',
          `COUNT(CASE WHEN orders."orderStatus" = '${COMPLETED}'
            THEN 1 END) as "fulfilledOrderCount"`,
          'NOW() AT TIME ZONE location.timezone as date',
        ])
        .leftJoin(
          subQuery => {
            return subQuery
              .select([
                'order.id as id',
                'order.orderStatus as "orderStatus"',
                'order.location_id as "locationId"',
              ])
              .from(Order, 'order')
              .innerJoin('order.location', 'location')
              .leftJoin('order.products', 'products')
              .leftJoin(
                // get latest order_history.created date for each order id
                subQuery2 => {
                  return subQuery2
                    .select(`DISTINCT ON (order_id) order_id, created`)
                    .from(OrderHistory, 'order_history')
                    .groupBy('order_id, created')
                    .orderBy('order_id')
                    .addOrderBy('created', 'DESC');
                },
                'order_history',
                'order_history.order_id = order.id',
              )
              .where(
                `date_trunc('day', (order_history.created AT TIME ZONE 'UTC' AT TIME ZONE location.timezone)) =
               date_trunc('day', NOW() AT TIME ZONE location.timezone)`,
              )
              .andWhere('products.quantity > 0')
              .andWhere('order.orderStatus != :closed', {
                closed: OrderStatus.CLOSED,
              })
              .groupBy('order.id, location.id');
          },
          'orders',
          'orders."locationId" = location.id',
        )
        .where('location.id = :locationId', {
          locationId,
        })
        .groupBy('location.id')
        .getRawOne();
    } catch (error) {
      throw error;
    }
  }

  public async getOrderCountSummary(
    interval: OrderViewType,
    user: User,
  ): Promise<OrderCountSummaryDto[]> {
    // default to daily interval
    let queryInterval = 'day';
    if (interval === OrderViewType.WEEKLY) queryInterval = 'week';
    if (interval === OrderViewType.MONTHLY) queryInterval = 'month';
    const { COMPLETED, OPEN, CANCELLED, SUBMITTED, DELIVERY } = OrderStatus;
    const query = this.locationRepository.createQueryBuilder('location').select(
      `location.id as "locationId",
        location.name as "locationName",
        location.timezone as "locationTimezone",
        COUNT(CASE WHEN orders."orderStatus" = '${COMPLETED}' THEN 1 END) as "completedCount",
        COUNT(CASE WHEN orders."orderStatus" = '${OPEN}' THEN 1 END) as "openCount",
        COUNT(CASE WHEN orders."orderStatus" = '${CANCELLED}' THEN 1 END) as "cancelledCount",
        COUNT(CASE WHEN orders."orderStatus" = '${SUBMITTED}' THEN 1 END) as "submittedCount",
        COUNT(CASE WHEN orders."orderStatus" = '${DELIVERY}' THEN 1 END) as "deliveryCount",
        COUNT(orders.id) as "totalCount"`,
    );

    if (!user.roles || !_.find(user.roles, { name: RoleEnum.Admin })) {
      query.innerJoin(
        'user_location',
        'user_location',
        `user_location.location_id = "location".id
          AND user_location.user_id = :userId
          AND user_location.deleted = false`,
        { userId: user.id },
      );
    }

    return query
      .leftJoin(
        subQuery => {
          return subQuery
            .select([
              'order.id as id',
              'order.orderStatus as "orderStatus"',
              'order.location_id as "locationId"',
            ])
            .from(Order, 'order')
            .innerJoin('order.location', 'location')
            .leftJoin('order.products', 'products')
            .leftJoin(
              // get latest order_history.created date for each order id
              subQuery2 => {
                return subQuery2
                  .select(`DISTINCT ON (order_id) order_id, created`)
                  .from(OrderHistory, 'order_history')
                  .groupBy('order_id, created')
                  .orderBy('order_id')
                  .addOrderBy('created', 'DESC');
              },
              'order_history',
              'order_history.order_id = "order".id',
            )
            .where(
              `date_trunc(:queryInterval, (order_history.created AT TIME ZONE 'UTC' AT TIME ZONE location.timezone)) =
               date_trunc(:queryInterval, NOW() AT TIME ZONE location.timezone)`,
              { queryInterval },
            )
            .andWhere('products.quantity > 0')
            .andWhere('order.orderStatus != :closed', {
              closed: OrderStatus.CLOSED,
            })
            .groupBy('order.id, location.id');
        },
        'orders',
        'orders."locationId" = location.id',
      )
      .where('location.deleted = false')
      .orderBy('location.name')
      .groupBy('location.id')
      .getRawMany();
  }

  public async setOrderDelivery(
    orderId: number,
    orderDto: OrderUpdateDeliveryDto,
    requestUserId: number,
  ): Promise<Order> {
    if (!orderId) throw new BadRequestException('order id not provided');
    try {
      /** in CMS, dont provide permission to Employee to set delivery */
      const requestUser =
        (await this.userService.findById(requestUserId)) ||
        ({ roles: [] } as User);
      const userRoles = requestUser.roles.map(ur => ur.name);
      const { SiteAdmin, Admin } = RoleEnum;
      const allowedNonOwners = !!_.intersection(userRoles, [SiteAdmin, Admin])
        .length;

      /** allowedNonOwners here means we get the order without filtering for ownership */
      const order = await this.getOrder(
        orderId,
        requestUserId,
        allowedNonOwners,
      );

      // Validate the request
      const { patientNotOrderOwner } = OrderExceptions;
      GDExpectedException.try(patientNotOrderOwner, {
        user: requestUser,
        order,
        allowedNonOwners,
      });

      // For Admins, they should be permitted to retrieve other user's address ID in CMS UI.
      let userAddress = new UserAddress();
      if (orderDto.userAddressId) {
        userAddress = await this.userService.getUserAddressById(
          requestUserId,
          orderDto.userAddressId,
        );
      }

      // Validation ok, proceed with update
      const updates = (orderDto.isDelivery
        ? {
            isDelivery: orderDto.isDelivery,
            deliveryAddressReferenceId: userAddress.id || null,
            deliveryNickname: userAddress.nickname || null,
            deliveryAddressLine1: userAddress.addressLine1 || null,
            deliveryAddressLine2: userAddress.addressLine2 || null,
            deliveryCity: userAddress.city || null,
            deliveryInstruction: userAddress.instruction || null,
            deliveryPostalCode: userAddress.postalCode || null,
            deliveryState: userAddress.state || null,
            fullfillmentMethod: FulfillmentMethod.DELIVERY,
            deliveryTimeSlot: orderDto.selectedTimeSlot,
          }
        : {
            isDelivery: orderDto.isDelivery,
            deliveryAddressReferenceId: orderDto.userAddressId,
            deliveryNickname: null,
            deliveryAddressLine1: null,
            deliveryAddressLine2: null,
            deliveryCity: null,
            deliveryInstruction: null,
            deliveryPostalCode: null,
            deliveryState: null,
            fullfillmentMethod: FulfillmentMethod.PICKUP,
            deliveryTimeSlot: null,
          }) as Order;

      await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({
          ...updates,
          modifiedBy: requestUserId,
        })
        .where('id = :orderId', {
          orderId,
        })
        .execute();
      await this.refreshSaveOrderTotals(orderId, requestUserId); // recalculate for delivery fees
      const updatedOrder = await this.getOrder(
        orderId,
        requestUserId,
        allowedNonOwners,
      );
      return Promise.resolve(updatedOrder);
    } catch (error) {
      throw error;
    }
  }

  public async getOrdersForCsv(params: OrderReportParams): Promise<Order[]> {
    const { modifiedDateFrom, modifiedDateTo } = params;

    /**
     * IMPORTANT: always recheck computations with orderService.getOrder() logic
     */
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select([
        'order.id as id',
        'location.name as "locationName"',
        'user.patientNumber as "patientNumber"',
        'user.mobileNumber as "mobileNumber"',
        'products.total as "subtotal"',
        'order.couponTotal as "couponTotal"',
        'orderTax.stateTax as "stateTax"',
        'orderTax.muniTax as "muniTax"',
        'order.deliveryPatientFee as "deliveryPatientFee"',
        'order.deliveryDispensaryFee as "deliveryDispensaryFee"',
        `products.total
          - order.couponTotal
          + (orderTax.stateTax + orderTax.muniTax)
          + (CASE WHEN order.isDelivery IS TRUE THEN order.deliveryPatientFee ELSE 0 END)
          as "total"`,
        'order.fullfillmentMethod as "fulfillmentMethod"',
        'order.orderStatus as "orderStatus"',
        // `order.modified AT TIME ZONE 'UTC' as "modified"`,
        `order.modified AT TIME ZONE 'UTC' AT TIME ZONE location.timezone as "modifiedLocal"`,
        `order_history.created AT TIME ZONE 'UTC' AT TIME ZONE location.timezone as "dateOfLatestOrderStatus"`,
      ])
      .innerJoinAndSelect('order.user', 'user')
      .innerJoinAndSelect('order.location', 'location')
      .leftJoin(
        subQuery => {
          return subQuery
            .select([
              'order_id as order_id',
              '(ARRAY_AGG(product_id order by name))[1] as product_id',
              'SUM(price * quantity)::float as "total"',
              'COUNT(product_id)::float as "count"',
            ])
            .from(OrderProduct, null)
            .where('quantity > 0')
            .groupBy('order_id');
        },
        'products',
        'products.order_id = order.id',
      )
      .leftJoin('order.orderTax', 'orderTax')
      .leftJoin(
        // get latest order_history.created date for each order id
        subQuery2 => {
          return subQuery2
            .select(`DISTINCT ON (order_id) order_id, created`)
            .from(OrderHistory, 'order_history')
            .groupBy('order_id, created')
            .orderBy('order_id')
            .addOrderBy('created', 'DESC');
        },
        'order_history',
        'order_history.order_id = "order".id',
      )
      .where('order.orderStatus != :closed', { closed: OrderStatus.CLOSED }) // skip empty carts
      .andWhere('products.count > 0')
      .andWhere(
        `order_history.created AT Time ZONE 'UTC' AT TIME ZONE location.timezone
        BETWEEN :modifiedDateFrom AND :modifiedDateTo`,
        {
          modifiedDateFrom,
          modifiedDateTo,
        },
      )
      .orderBy('order.location_id, order_history.created', 'ASC', 'NULLS LAST');

    if (params.locationId || !params.allLocations) {
      query.andWhere('order.location_id = :locationId', {
        locationId: params.locationId,
      });
    }

    return query.getRawMany();
  }

  public async removeAllProductsFromCart(
    userId: number,
  ): Promise<UpdateResult> {
    let result = null;
    try {
      const cart = await this.getCart(userId);
      result = this.orderProductRepository
        .createQueryBuilder()
        .update(OrderProduct)
        .set({ quantity: 0, modifiedBy: userId })
        .where('order_id = :cartId', {
          cartId: cart.id,
        })
        .execute();
      await this.refreshSaveOrderTotals(cart.id, userId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * "Running" refers to orders currently being processed (not open cart, cancelled, completed, nor closed)
   * This returns the first one order record found.
   * @param userId
   * @param fulfillmentMethod optional - used to filter Pickup or Delivery
   * @returns the running Order with minimal joins
   */
  public async getRunningOrder(
    userId: number,
    fulfillmentMethod?: FulfillmentMethod,
  ): Promise<Order> {
    if (!userId) {
      return Promise.resolve(null);
    }

    // Note: Order has no 'isDeleted' column, only statuses
    const { SUBMITTED, DELIVERY, DELIVERED } = OrderStatus;
    const RUNNING_STATUSES = { SUBMITTED, DELIVERY, DELIVERED };
    const query = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .where(
        'order.orderStatus IN (:SUBMITTED, :DELIVERY, :DELIVERED)',
        RUNNING_STATUSES,
      )
      .andWhere('user.id = :userId', { userId });
    if (fulfillmentMethod) {
      query.andWhere('order.fullfillmentMethod = :fulfillmentMethod', {
        fulfillmentMethod,
      });
    }
    const order = await query.getOne();
    return Promise.resolve(order);
  }

  public async overrideHistoryCreatedDate(
    orderId: number,
    userId: number,
    orderHistory: OrderHistoryUpdateDto,
  ): Promise<Order> {
    try {
      GDExpectedException.try(
        OrderExceptions.futureOrderModifiedDate,
        orderHistory,
      );
      await this.orderHistoryRepository
        .createQueryBuilder()
        .update(OrderHistory)
        .set({
          created: orderHistory.created,
          createdBy: userId,
        })
        .where('id = :orderHistoryId', {
          orderHistoryId: orderHistory.orderHistoryId,
        })
        .andWhere('orderStatus = :orderStatus', {
          orderStatus: orderHistory.orderStatus,
        })
        .andWhere('order = :orderId', { orderId })
        .execute();
      return this.getOrder(orderId, userId, true);
    } catch (error) {
      throw error;
    }
  }

  public async sendOrderSubmitNotifications(order: Order, request?) {
    // K@m35h disabled default sms
    if (isProductionEnv() && !order.isDelivery) {
      const mobileNumber = !!(
        request &&
        request.user &&
        request.user.mobileNumber
      )
        ? request.user.mobileNumber
        : order.user.mobileNumber;
      const consumerTextMessage = this.composeSubmitSMS(order, mobileNumber);
      await this.notificationService.sendTextMessage(consumerTextMessage);
      if (order.location.notificationMobileNumber) {
        const locationTextMessage = this.composeLocationNotificationSMS(
          order,
          order.location.notificationMobileNumber,
        );
        await this.notificationService.sendTextMessage(locationTextMessage);
      }
      if (order.isDelivery && order.location.notificationDeliveryMobileNumber) {
        const locationTextMessage = this.composeLocationNotificationSMS(
          order,
          order.location.notificationDeliveryMobileNumber,
        );
        await this.notificationService.sendTextMessage(locationTextMessage);
      }
      if (
        order.location.organization.posConfig &&
        order.location.organization.posConfig.isEmailNotification
      ) {
        const email = order.location.organization.contactEmail;
        const locationEmailMessage = this.composeLocationNotificationEmail(
          order,
          email,
        );
        await this.notificationService.sendEmail(locationEmailMessage);
      }
    }
  }

  public async update(
    orderId: number,
    order: Partial<Order>,
    userId: number,
  ): Promise<UpdateResult> {
    try {
      return await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ ...order, modifiedBy: userId })
        .where('id = :orderId', { orderId })
        .execute();
    } catch (error) {
      throw error;
    }
  }

  public async updateOrderProductsQuantity(
    orderProductsUpdate: OrderProductUpdateQuantityDto[],
    modifiedBy: number,
  ): Promise<OrderProduct[]> {
    try {
      const orderProducts: OrderProduct[] = orderProductsUpdate.map(
        orderProduct => {
          return {
            ...new OrderProduct(),
            id: orderProduct.id,
            quantity: orderProduct.quantity,
            modifiedBy,
          };
        },
      );
      return this.orderProductRepository.save(orderProducts);
      // TODO update order total amount? taxes? discount?
    } catch (error) {
      throw error;
    }
  }
}
