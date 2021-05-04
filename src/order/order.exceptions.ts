import { HttpStatus } from '@nestjs/common';

import { isFuture } from 'date-fns';
import { isEmpty, includes } from 'lodash';

import { ExpectedExceptionMap } from '../app.interface';
import { OrderProduct } from '../entities/order-product.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import {
  LocationSearchDto,
  PricingType,
} from '../location/dto/location-search.dto';
import { OrderHistoryUpdateDto } from './dto/order-search.dto';
import { FulfillmentMethod, OrderStatus } from './order-status.enum';
import { ProductPricingWeight } from '../entities/product-pricing-weight.entity';
import { weightProductName } from './order.service';

export interface UserOrder {
  user: User;
  order: Order;
}

export interface LocationOrderPair {
  location: LocationSearchDto;
  order: Order;
}

// K@m35h
export const MINIMUM_DELIVERY_AMOUNT = 0;
export const EMPTY_PRICING = {
  id: 0,
  weightPrices: [] as ProductPricingWeight[],
  price: null,
};

const { SUBMITTED, DELIVERY, DELIVERED } = OrderStatus;

export const OrderExceptions: ExpectedExceptionMap = {
  invalidLocation: {
    message: 'Error: You can only order from one Dispensary at a time.',
    httpStatus: HttpStatus.CONFLICT,
    failCondition: ({ cartLocation, productLocation }) =>
      cartLocation && productLocation && cartLocation.id !== productLocation.id,
    i18n: { 'es-PR': 'Error: Solo puede ordenar de un dispensario a la vez.' },
  },
  outOfStockProductToCart: {
    message: 'Error: Out of stock product cannot be added',
    i18n: { 'es-PR': 'Error: No se puede agregar el producto fuera de stock.' },
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (product: Product) => !product.isInStock,
  },
  productNotFound: {
    message: 'Error: Product not found',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: product => !product || !product.id,
    i18n: { 'es-PR': 'El producto no encontrada.' },
  },
  productHasNoPrice: {
    message: 'Error: Cannot order unpriced product. Try again later.',
    httpStatus: HttpStatus.FORBIDDEN,
    failCondition: (product: Product) =>
      !product.pricing ||
      !(product.pricing.weightPrices.length || product.pricing.price),
    i18n: {
      'es-PR':
        'Error: No se puede pedir un producto sin precio. Inténtalo de nuevo más tarde.',
    },
  },
  userHasNoMobileNumber: {
    message:
      'Error: A verified phone number is required before submitting your order.',
    httpStatus: HttpStatus.FORBIDDEN,
    failCondition: (user: User) => !user.mobileNumber,
    i18n: {
      'es-PR':
        'Error: se requiere un número de teléfono verificado antes de enviar su pedido.',
    },
  },
  userHasNoPatientId: {
    message:
      'Error: Please provide your Patient ID number before submitting your order.',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    failCondition: (user: User) => !user.patientNumber,
    i18n: {
      'es-PR':
        'Error: se requiere un Número de Identificación del paciente antes de enviar su pedido.',
    },
  },
  locationClosed: {
    message: 'Error: Location is currently closed.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (location: LocationSearchDto) => {
      const { hours, hoursToday } = location;
      const isOrderingAvailable =
        hoursToday && (hoursToday.isOpen || hoursToday.isOffHours);
      return !(hours && hours.length) || !isOrderingAvailable;
    },
    i18n: { 'es-PR': 'Error: la ubicación está actualmente cerrada.' },
  },
  exceededAllowedQuantity: {
    message: 'Error: You can only order up to 10 items per product.',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    failCondition: (orderProduct: OrderProduct) => orderProduct.quantity > 10,
    i18n: {
      'es-PR': 'Error: Solo puede pedir hasta 10 artículos por producto.',
    },
  },
  userAddressRequiredForDelivery: {
    message: 'Error: Please provide a delivery address.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (order: Order) =>
      order.isDelivery &&
      !(
        order.deliveryNickname &&
        order.deliveryAddressLine1 &&
        order.deliveryCity &&
        order.deliveryState &&
        order.deliveryPostalCode
      ),
    i18n: { 'es-PR': 'Error: Por favor proporcione una dirección de entrega.' },
  },
  patientNotOrderOwner: {
    message:
      'Error: Only the order owner can change the order delivery setting.',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: {
      'es-PR':
        'Solo el propietario del pedido puede cambiar la configuración de entrega del pedido.',
    },
    failCondition: ({
      user,
      order,
      allowedNonOwners,
    }: {
      user: User;
      order: Order;
      allowedNonOwners: boolean;
    }) =>
      !user ||
      !order ||
      (!allowedNonOwners ? user.id !== order.user.id : false),
  },
  noEmailForIdentification: {
    message: 'Error: Email is required.',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    i18n: {
      'es-PR': 'correo electronico es requerido',
    },
    failCondition: (email: string) => !email,
  },
  invalidMedicalId: {
    message:
      'Your record on file appears to have an invalid or expired Medical ID. Please contact the dispensary to update your file.',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    i18n: {
      'es-PR':
        'Su registro en el archivo parece tener una identificación médica inválida o caducada.\
        Por favor, póngase en contacto con el dispensario para actualizar su archivo.',
    },
  },
  locationHasNoDelivery: {
    message: 'Error: Location does not offer delivery.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    i18n: {
      'es-PR': 'Error: la ubicación no ofrece entrega.',
    },
    failCondition: ({ order, location }: LocationOrderPair) =>
      order.isDelivery && !location.isDeliveryAvailable,
  },
  outsideDeliveryHoursWindow: {
    message:
      'Error: You can only submit orders for delivery during delivery hours.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    i18n: {
      'es-PR':
        'Error: Solo puede enviar pedidos para la entrega durante las horas de entrega.',
    },
    failCondition: ({ order, location }: LocationOrderPair) =>
      order.isDelivery &&
      location.isDeliveryAvailable &&
      location.deliveryHoursToday &&
      !location.deliveryHoursToday.isOpen,
  },
  hitLimitForOrderForDeliverySubmission: {
    message:
      'Error: You can only have one pending delivery at a time. You can still submit for Pickup.',
    httpStatus: HttpStatus.CONFLICT,
    i18n: {
      'es-PR':
        'Error: Sólo puede tener una pendiente de entrega a la vez. Todavía se puede presentar para su Recogida.',
    },
    failCondition: (existingRunningOrder: Order) =>
      existingRunningOrder &&
      existingRunningOrder.id &&
      (existingRunningOrder.isDelivery ||
        FulfillmentMethod.DELIVERY ===
          existingRunningOrder.fullfillmentMethod) &&
      includes(
        [SUBMITTED, DELIVERY, DELIVERED],
        existingRunningOrder.orderStatus,
      ),
  },
  futureOrderModifiedDate: {
    message: 'Error: order date cannot be future date',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (orderHistory: OrderHistoryUpdateDto) => {
      return isFuture(orderHistory.created);
    },
  },
  lessThanDeliveryAmountThreshold: {
    message: 'Error: Delivery is only available for orders above $75.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (order: Order) => {
      const productTotal = order.products.reduce(
        (sum, orderProduct) => sum + orderProduct.price * orderProduct.quantity,
        0,
      );
      return order.isDelivery && productTotal < MINIMUM_DELIVERY_AMOUNT;
    },
  },
  productNotAvailable: {
    message:
      'Error: Product variant is no longer available. Please remove it from your cart.',
    i18n: {
      'es-PR':
        'Error: La variante del producto ya no está disponible. Por favor quítelo de su carrito.',
    },
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: ({
      product,
      productPricingWeight,
    }: {
      product: Product;
      productPricingWeight: ProductPricingWeight;
    }) => {
      const isActiveProduct =
        product.isInStock && !(product.hidden || product.deleted);
      const isByWeight = product.pricingType === PricingType.Weight;

      // Note: this exception ignores WEIGHT-type that defaults to UNIT 1g pricing.
      return (
        !isActiveProduct ||
        (isByWeight &&
          !isEmpty(productPricingWeight) && productPricingWeight.deleted)
      );
    },
  },
  orderProductMismatchFromInventory: {
    message:
      'Some items in your cart have updated details/price. Please refresh them to review the changes before submitting.',
    httpStatus: HttpStatus.BAD_REQUEST,
    i18n: {
      'es-PR':
        'Algunos artículos en su carrito han actualizado sus detalles / precio. Actualícese para revisar los cambios antes de enviarlos.',
    },
    failCondition: (cart: Order) => {
      const { products: orderProducts = [] } = cart;
      if (isEmpty(orderProducts)) {
        return false; // skip checking
      }

      // ! This logic is equivalent to change detection in WEB > cart-item.component
      const hasPriceChanged = orderProducts.some(orderProduct => {
        // Note: productPricingWeight is a join from product, so is latest
        const {
          product,
          price,
          productPricingWeight: pricingWeightInCart,
        } = orderProduct;
        const { pricing, pricingType } = product;
        const { weightPrices = [] } = pricing || EMPTY_PRICING;

        // ALSO: if WEIGHT but no weight prices, fallback to UNIT price (presumably 1g default)
        const isByWeight = pricingType === PricingType.Weight;
        return !(isByWeight
          ? !isEmpty(pricingWeightInCart) && !pricingWeightInCart.deleted
            ? pricingWeightInCart.price === price &&
              weightPrices.find(wp => wp.name === pricingWeightInCart.name)
            : !isEmpty(weightPrices)
            ? weightPrices.find(wp => wp.price === pricing.price)
            : price === pricing.price
          : price === pricing.price);
      });
      const hasAvailabilityChanged = orderProducts.some(
        ({ product, productPricingWeight }) =>
          OrderExceptions.productNotAvailable.failCondition({
            product,
            productPricingWeight,
          }),
      );
      const hasDetailsChanged = orderProducts.some(
        ({ product, productPricingWeight: pw, name: orderProductName }) => {
          const { pricingType, name } = product;
          // Compose the "name (weight)" convention used by API when adding by product weight.
          const expectedName = !isEmpty(pw)
            ? `${name} (${pw.name})`
            : pricingType === PricingType.Weight
            ? weightProductName(product)
            : name;

          return !(expectedName === orderProductName);
        },
      );
      return hasAvailabilityChanged || hasPriceChanged || hasDetailsChanged;
    },
  },
};
