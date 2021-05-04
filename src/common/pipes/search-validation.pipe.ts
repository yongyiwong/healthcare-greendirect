import {
  PipeTransform,
  ArgumentMetadata,
  Injectable,
  Inject,
} from '@nestjs/common';
import { getMetadataArgsStorage } from 'typeorm';
import { ConfigService } from '@sierralabs/nest-utils';
import * as _ from 'lodash';
const configService = new ConfigService();

export class SearchValidationPipe implements PipeTransform<any> {
  constructor(private readonly entity) {
    this.entity = entity;
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    switch (metadata.data) {
      case 'search':
        return value;
      case 'page':
        return this.transformPage(value);
      case 'limit':
        return this.transformLimit(value);
      case 'order':
        return this.transformOrder(value);
    }
    return value;
  }

  transformPage(value) {
    return value || 0;
  }

  transformLimit(value) {
    const maxSize = configService.get('pagination.maxPageSize') || 200;
    const defaultSize = configService.get('pagination.defaultPageSize') || 100;
    return Math.min(maxSize, value || defaultSize);
  }

  /**
   * Transforms a string order to a TypeORM compatible order object.
   * @param value Expects a string of `[column_name] [asc|desc]`.
   */
  transformOrder(value) {
    if (!value || !_.isString(value)) return value;
    const orderParts = value.split(' ');
    const propertyName = orderParts[0];
    const order = orderParts[1] || 'ASC';

    const metadataStorage = getMetadataArgsStorage();
    const column = _.find(metadataStorage.columns, {
      target: this.entity,
      propertyName,
    });
    if (!column) return undefined;
    const orderConfig = {};
    orderConfig[propertyName] = order.toUpperCase();
    return orderConfig;
  }
}
