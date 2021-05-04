import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import * as stringify from 'csv-stringify';
import * as transform from 'stream-transform';

import {
  OrderStatus,
  OrderStatusDescription,
} from '../order/order-status.enum';
@Injectable()
export class CsvService {
  createCsvStream(
    entities: object[],
    options: stringify.Options,
    transformer: (record: object) => object,
  ): Readable {
    // return stream.Readable. can be used with pipe()

    return transform(entities, transformer).pipe(stringify(options));
  }
}
