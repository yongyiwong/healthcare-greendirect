import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Readable } from 'stream';
import { format, subMonths, lastDayOfMonth } from 'date-fns';
import { Repository } from 'typeorm';
import { range, isEmpty, orderBy } from 'lodash';

import { OrderReportParams } from './params/order-params.interface';
import { CsvService } from './csv.service';
import { OrderService } from '../order/order.service';
import {
  OrderStatusDescription,
  OrderStatus,
} from '../order/order-status.enum';
import { OrderHistory } from '../entities/order-history.entity';
import { Order } from '../entities/order.entity';
import { GDExpectedException } from '../gd-expected.exception';
import { ReportsExceptions } from './reports.exceptions';

interface MonthlySale {
  date: string;
  amount: number;
}

export interface OrdersStatsDto {
  [date: string]: {
    allOrdersCount: number;
    completedOrdersCount?: number;
    totalSales: number;
    averageSales?: number;
    monthlySales: MonthlySale[] | number[];
  };
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order) protected orderRepository: Repository<Order>,
    @InjectRepository(OrderHistory)
    protected orderHistoryRepository: Repository<OrderHistory>,
    private readonly csvService: CsvService,
    private readonly orderService: OrderService,
  ) {}

  public async generateOrdersReport(
    params: OrderReportParams,
  ): Promise<Readable> {
    let orders = [];
    try {
      orders = await this.orderService.getOrdersForCsv(params);
    } catch (error) {
      // Capture the error from the data layer.
      GDExpectedException.throw(ReportsExceptions.ordersReportGenerationFailed);
    }

    /* Keys must matched returned by SQL:
      beware of SQL aliases, stick to the actual column names if possible
     */
    const orderColumns = {
      id: 'Order Id',
      locationName: 'Location',
      patientNumber: 'Patient ID',
      mobileNumber: 'Mobile Number',
      subtotal: 'Subtotal',
      couponTotal: 'Discount',
      stateTax: 'State Tax',
      muniTax: 'Municipal Tax',
      deliveryDispensaryFee: 'Delivery Dispensary Fee',
      deliveryPatientFee: 'Delivery Patient Fee',
      total: 'Total',
      fulfillmentMethod: 'Type',
      orderStatus: 'Status',
      // modified: 'Last Modified (UTC)',
      dateOfLatestOrderStatus: 'Lastest Status Date',
    };

    const options = {
      header: true,
      quotedEmpty: true,
      columns: orderColumns,
      cast: {
        date: value => format(value, 'YYYY-MM-DD hh:mm A'),
      },
    };

    // Use transformer function for types not supported by options.cast
    const transformer = (record: any) => {
      const order = record as Order;
      // NOTE: some fields might be custom SELECT and not found in Order entity
      return {
        ...order,
        orderStatus: OrderStatusDescription[order.orderStatus].name,
        fulfillmentMethod:
          record.fulfillmentMethod[0].toUpperCase() +
          record.fulfillmentMethod.slice(1),
      } as any; // loose-type the columns
    };

    // Use case: Order status should show user friendly value from dictionary.
    return Promise.resolve(
      this.csvService.createCsvStream(orders, options, transformer),
    );
  }

  // TODO: Add Unit Test
  public async getOrdersStats(
    year: number,
    month: number = 12,
    numberOfMonthsAgo: number = 12,
    yearly: boolean = false,
  ): Promise<OrdersStatsDto> {
    try {
      GDExpectedException.try(ReportsExceptions.reportYearInvalid, year);
      GDExpectedException.try(ReportsExceptions.reportMonthInvalid, month);
      GDExpectedException.try(
        ReportsExceptions.reportNumberOfMonthsAgoInvalid,
        numberOfMonthsAgo,
      );

      const completedOrdersStatus = [OrderStatus.COMPLETED];

      const promises: Promise<MonthlySale[] | number[] | number>[] = [
        this.getOrdersCount(year, month, numberOfMonthsAgo),
        this.getOrdersCount(
          year,
          month,
          numberOfMonthsAgo,
          completedOrdersStatus,
        ),
        this.getOrdersSales(
          year,
          month,
          numberOfMonthsAgo,
          completedOrdersStatus,
        ),
        this.getOrdersSales(
          year,
          month,
          numberOfMonthsAgo,
          completedOrdersStatus,
          true,
        ),
        this.getMonthlyTotalSales(
          year,
          month,
          numberOfMonthsAgo,
          completedOrdersStatus,
          yearly,
        ),
      ];

      const [
        allOrdersCount = 0,
        completedOrdersCount = 0,
        totalSales = 0,
        averageSales = 0,
        monthlySales = [],
      ] = await Promise.all(promises);

      return {
        [year]: {
          allOrdersCount,
          completedOrdersCount,
          totalSales,
          averageSales,
          monthlySales,
        },
      } as OrdersStatsDto;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Counts the orders submitted within the time range provided. Excludes carts (Open, Closed)
   * and (Cancelled) statuses by default.
   * @param year
   * @param month
   * @param numberOfMonthsAgo
   * @param statuses
   */
  private async getOrdersCount(
    year: number,
    month: number,
    numberOfMonthsAgo: number,
    statuses?: OrderStatus[],
  ): Promise<number> {
    try {
      const tableName = 'order';

      // `OPEN` and `CLOSED` statuses are only used for carts, NOT orders
      // while Cancelled has no profits.
      const excludeStatuses = [
        OrderStatus.OPEN,
        OrderStatus.CLOSED,
        OrderStatus.CANCELLED,
      ];
      const dateFormat = 'YYYY-MM-DD';
      const mostRecentDate = format(
        lastDayOfMonth(new Date(year, month, 1)),
        dateFormat,
      );

      const pastMonth = `BETWEEN
      (TO_DATE('${mostRecentDate}', '${dateFormat}')
      - (INTERVAL '${numberOfMonthsAgo} months' - INTERVAL '1 day'))::DATE
      AND TO_DATE('${mostRecentDate}', '${dateFormat}')`;

      const submittedPastMonth = `${tableName}.submittedDate ::DATE ${pastMonth}`;

      const query = this.orderRepository
        .createQueryBuilder(tableName)
        .select(`${tableName}.id, ${tableName}.submittedDate`)
        .where(submittedPastMonth)
        .andWhere(`${tableName}.orderStatus NOT IN (:...excludeStatuses)`, {
          excludeStatuses,
        })
        .orderBy(`${tableName}.submittedDate`);

      if (!isEmpty(statuses)) {
        query.andWhere(`${tableName}.orderStatus IN (:...statuses)`, {
          statuses,
        });
      }

      return query.getCount();
    } catch (error) {
      throw error;
    }
  }

  private async getOrdersSales(
    year: number,
    month: number,
    numberOfMonthsAgo: number = 1,
    statuses?: OrderStatus[],
    isAverage: boolean = false,
  ): Promise<number> {
    try {
      const tableName = 'orderHistory';
      const dateFormat = 'YYYY-MM-DD';
      const mostRecentDate = format(
        lastDayOfMonth(new Date(year, month, 1)),
        dateFormat,
      );

      const pastMonth = `BETWEEN
      (TO_DATE('${mostRecentDate}', '${dateFormat}')
      - (INTERVAL '${numberOfMonthsAgo} months' - INTERVAL '1 day'))::DATE
      AND TO_DATE('${mostRecentDate}', '${dateFormat}')`;

      const paymentPastMonth = `${tableName}.created ::DATE ${pastMonth}`;

      const subQuery = this.orderHistoryRepository
        .createQueryBuilder(tableName)
        .select(`MAX(${tableName}.created)`, 'created')
        .groupBy(`${tableName}.order`);

      const query = this.orderHistoryRepository
        .createQueryBuilder(tableName)
        .select(`SUM(order.orderTotal)`)
        .innerJoin(
          `(${subQuery.getQuery()})`,
          'deduped_order_history',
          `${tableName}.created = deduped_order_history.created`,
        )
        .leftJoin(`${tableName}.order`, `order`)
        .where(paymentPastMonth);

      if (!isEmpty(statuses)) {
        query.andWhere(`${tableName}.orderStatus IN (:...statuses)`, {
          statuses,
        });
      }

      let [{ sum }] = await query.execute();
      sum = sum || 0;
      return isAverage ? sum / (numberOfMonthsAgo || 1) : sum;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Computes total orders in the backwards past months
   * @param year
   * @param month 0-based count of month
   * @param numberOfMonthsAgo
   * @param statuses
   * @param yearly
   */
  private async getMonthlyTotalSales(
    year: number,
    month: number,
    numberOfMonthsAgo: number,
    statuses: OrderStatus[] = [OrderStatus.COMPLETED],
    yearly: boolean = false,
  ): Promise<MonthlySale[] | number[]> {
    try {
      const tableName = 'orderHistory';

      const dateFormat = 'YYYY-MM-DD';
      const mostRecentDate = format(
        lastDayOfMonth(new Date(year, month, 1)),
        dateFormat,
      );

      const pastMonth = `BETWEEN
      (TO_DATE('${mostRecentDate}', '${dateFormat}')
      - (INTERVAL '${numberOfMonthsAgo} months' - INTERVAL '1 day'))::DATE
      AND TO_DATE('${mostRecentDate}', '${dateFormat}')`;

      const paymentPastMonth = `${tableName}.created ::DATE ${pastMonth}`;
      const dateColumn = `TO_CHAR(${tableName}.created, 'YYYY-MM')`;

      const subQuery = this.orderHistoryRepository
        .createQueryBuilder(tableName)
        .select(`MAX(${tableName}.created)`, 'created')
        .groupBy(`${tableName}.order`);

      const query = this.orderHistoryRepository
        .createQueryBuilder(tableName)
        .select(dateColumn, 'date')
        .addSelect(`SUM(order.orderTotal)`, 'amount')
        .innerJoin(
          `(${subQuery.getQuery()})`,
          'deduped_order_history',
          `${tableName}.created = deduped_order_history.created`,
        )
        .leftJoin(`${tableName}.order`, 'order')
        .where(`${dateColumn} IS NOT NULL`)
        .andWhere(paymentPastMonth)
        .orderBy('date')
        .groupBy('date');

      if (!isEmpty(statuses)) {
        query.andWhere(`${tableName}.orderStatus IN (:...statuses)`, {
          statuses,
        });
      }
      const monthlySales: MonthlySale[] = await query.getRawMany();

      // ? should we include a param to optionally exclude current month?
      const startDate = lastDayOfMonth(new Date(year, month, 1));
      const dates: string[] = range(0, numberOfMonthsAgo, 1)
        .map(monthBack => format(subMonths(startDate, monthBack), 'YYYY-MM'))
        .reverse(); // 'YYYY-MM'[]

      let populatedMonthlySale: MonthlySale[] | number[] = dates.map(
        (date: string) => {
          const monthlySale = monthlySales.find(sale => date === sale.date);
          return {
            date,
            amount: (monthlySale && monthlySale.amount) || 0,
          } as MonthlySale;
        },
      );

      if (yearly) {
        populatedMonthlySale = orderBy(populatedMonthlySale, ['date']);
        populatedMonthlySale = populatedMonthlySale.map(
          monthlySale => monthlySale.amount,
        );
      }

      return populatedMonthlySale;
    } catch (error) {
      throw error;
    }
  }
}
