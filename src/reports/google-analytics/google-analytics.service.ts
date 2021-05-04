import * as path from 'path';
import { range } from 'lodash';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@sierralabs/nest-utils';
import { google, analytics_v3 } from 'googleapis';
import { format, lastDayOfMonth } from 'date-fns';

import { AnnualMonthlyTotalDto } from '../dto/annual-monthly-total.dto';
import { ActiveTimePeriod } from '../dto/active-time-period.enum';
import { MonthlyDailyTotalDto } from '../dto/monthly-daily-total.dto';
import { GDExpectedException } from '../../gd-expected.exception';
import { ReportsExceptions } from '../reports.exceptions';
import {
  isProductionEnv,
  Environments,
  readFromFileAsync,
} from '../../app.service';

export interface GoogleAnalyticsConfig {
  clientEmail: string;
  viewId: string;
}

/**
 * Uses Google Analytics API v3
 * https://developers.google.com/analytics/devguides/reporting/core/v3/reference
 */
@Injectable()
export class GoogleAnalyticsService {
  config: GoogleAnalyticsConfig = null;
  jwt = null;

  constructor(private readonly configService: ConfigService) {
    this.config = configService.get('analytics.google');
  }

  /**
   * Check the available interfaces in googleapis/analytics_v3 namespace
   * @param startDate
   * @param endDate
   * @param metrics https://ga-dev-tools.appspot.com/dimensions-metrics-explorer/
   * @param dimensions
   */
  public async getGoogleAnalyticsData(
    startDate: string,
    endDate: string,
    metrics: string,
    dimensions?: string,
    sort?: string,
  ) {
    try {
      const auth = await this.getToken();
      const ids = 'ga:' + this.config.viewId; // 'ga:VIEW_ID' format

      /**
       * Ref: https://ga-dev-tools.appspot.com/query-explorer/
       * Details: https://ga-dev-tools.appspot.com/dimensions-metrics-explorer/
       * @param metrics
       */
      const params: analytics_v3.Params$Resource$Data$Ga$Get = {
        'start-date': startDate,
        'end-date': endDate,
        auth,
        ids,
        metrics,
        dimensions,
        sort,
      };
      return google.analytics('v3').data.ga.get(params);
    } catch (error) {
      throw error;
    }
  }

  public async getTotalUsers(year: number): Promise<AnnualMonthlyTotalDto> {
    try {
      GDExpectedException.try(
        ReportsExceptions.googleAnalyticsMisconfigured,
        this.config,
      );
      GDExpectedException.try(ReportsExceptions.reportYearInvalid, year);
    } catch (error) {
      throw error;
    }

    const months = range(0, 12); // 0 - 11

    const gaMetric = 'ga:users';
    const gaDimension = 'ga:month';
    const sort = 'ga:month'; // month ASC

    const yearlyReport: AnnualMonthlyTotalDto = {
      [year]: {
        total: 0,
        monthlyTotal: months.map(month => 0),
      },
    };
    try {
      const totaUsers = await this.getGoogleAnalyticsData(
        format(`${year}-01-01`, 'YYYY-MM-DD'),
        format(lastDayOfMonth(`${year}-12`), 'YYYY-MM-DD'),
        gaMetric,
        gaDimension,
        sort,
      );
      yearlyReport[year] = {
        total: Number(totaUsers.data.totalsForAllResults[gaMetric]),
        monthlyTotal: months.map(month =>
          Number(totaUsers.data.rows[month][1]),
        ),
      };
    } catch (error) {
      // else fail silently and return empty report
    }
    return yearlyReport;
  }

  public async getActiveUsers(
    year: number,
    month: number,
    activeTimePeriod: ActiveTimePeriod = ActiveTimePeriod.DAILY,
  ): Promise<MonthlyDailyTotalDto> {
    try {
      GDExpectedException.try(
        ReportsExceptions.googleAnalyticsMisconfigured,
        this.config,
      );
      GDExpectedException.try(ReportsExceptions.reportYearInvalid, year);
      GDExpectedException.try(ReportsExceptions.reportMonthInvalid, month);
    } catch (error) {
      throw error;
    }

    const gaDimension = 'ga:date';
    let gaMetric;
    switch (activeTimePeriod) {
      case ActiveTimePeriod.DAILY:
        gaMetric = 'ga:1dayUsers';
        break;
      case ActiveTimePeriod.MONTHLY:
        gaMetric = 'ga:30dayUsers';
        break;
      default:
        gaMetric = 'ga:1dayUsers';
        break;
    }

    const startDate = new Date(year, month, 1);
    const lastDate = lastDayOfMonth(startDate);
    const days = range(0, lastDate.getDate()); // 0 - (lastDayOfMonth - 1)

    let report: MonthlyDailyTotalDto = {
      total: 0,
      dailyTotal: days.map(day => 0),
    };
    try {
      const totaUsers = await this.getGoogleAnalyticsData(
        format(startDate, 'YYYY-MM-DD'),
        format(lastDate, 'YYYY-MM-DD'),
        gaMetric,
        gaDimension,
      );

      report = {
        total: Number(totaUsers.data.totalsForAllResults[gaMetric]),
        dailyTotal: days.map(day => Number(totaUsers.data.rows[day][1])),
      };
    } catch (error) {
      // else fail silently and return empty report
    }
    return report;
  }

  /**
   * Select appropriate key for prod or dev from config/keys/
   * DEV is allowed only if you know the config.json values (should not be git-committed).
   */
  private async getPrivateKey() {
    let privateKey = '';
    const hasRequiredConfiguration =
      this.config.clientEmail && this.config.viewId;

    // Select which key file to load. Staging and Prod share the same prod keys
    // Uses DEV only IF the required config.json is provided
    const { DEV, PRODUCTION } = Environments;
    const configEnv = isProductionEnv()
      ? PRODUCTION
      : hasRequiredConfiguration
      ? DEV
      : '';
    if (configEnv) {
      privateKey = await readFromFileAsync(
        path.join(
          process.cwd(),
          `/config/keys/googleapi_privatekey.${configEnv}.p12`,
        ),
      );
    }
    return privateKey;
  }

  private async getToken() {
    const scopes = 'https://www.googleapis.com/auth/analytics.readonly';
    const privateKey = await this.getPrivateKey();

    this.jwt = new google.auth.JWT(
      this.config.clientEmail,
      null,
      privateKey,
      scopes,
    );
    return this.jwt;
  }
}
