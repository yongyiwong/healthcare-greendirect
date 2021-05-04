import * as path from 'path';
import * as CSV from 'csvtojson';
import { google } from 'googleapis';
import { padStart, range } from 'lodash';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@sierralabs/nest-utils';

import { GDExpectedException } from '../../gd-expected.exception';
import { ReportsExceptions } from '../reports.exceptions';
import { AnnualMonthlyTotalDto } from '../dto/annual-monthly-total.dto';
import {
  isProductionEnv,
  Environments,
  readFromFileAsync,
} from '../../app.service';

interface GooglePlayReport {
  Date: string;
  'Package Name': string;
  Device: string;
  'Daily Device Installs': string;
  'Daily Device Uninstalls': string;
  'Daily Device Upgrades': string;
  'Total User Installs': string;
  'Daily User Installs': string;
  'Daily User Uninstalls': string;
  'Active Device Installs': string;
  'Install events': string;
  'Update events': string;
  'Uninstall events': string;
}
export interface GooglePlayConfig {
  clientEmail: string;
  bucketId: string;
  appPackageName: string;
}

@Injectable()
export class GooglePlayService {
  public config: GooglePlayConfig = null;

  constructor(private readonly configService: ConfigService) {
    this.config = configService.get('analytics.googleplay');
  }

  public async getGooglePlayReport(
    year: number,
  ): Promise<AnnualMonthlyTotalDto> {
    let jwt = null;
    try {
      GDExpectedException.try(ReportsExceptions.reportYearInvalid, year);
      GDExpectedException.try(
        ReportsExceptions.googlePlayMisconfigured,
        this.config,
      );
      jwt = await this.getJWT();
      GDExpectedException.try(ReportsExceptions.googlePlayUnauthorized, jwt);
    } catch (error) {
      throw error;
    }

    const storage = google.storage('v1');
    const months = range(1, 12 + 1); // 1 - 12
    const yearlyReport: AnnualMonthlyTotalDto = {
      [year]: { total: 0, monthlyTotal: months.map(month => 0) },
    };

    try {
      const promises: Promise<any>[] = months.map((month: number) => {
        const zeroPaddedMonth = padStart(month.toString(), 2, '0'); // 1 -> 01
        return storage.objects
          .get({
            auth: jwt,
            bucket: this.config.bucketId,
            object: `stats/installs/installs_${this.config.appPackageName}_${year}${zeroPaddedMonth}_device.csv`,
            alt: 'media',
          })
          .catch(() => null); // catch if there are no available report for this month.
      });
      const reports = await Promise.all(promises);

      const parsedReportsPromises: Promise<
        GooglePlayReport[]
      >[] = reports.map(report =>
        !report ? null : this.parseCsv(report.data),
      );
      const parsedReports: GooglePlayReport[][] = await Promise.all(
        parsedReportsPromises,
      );

      // Compose report
      const monthlyTotal: number[] = parsedReports.map(
        (report: GooglePlayReport[]) => {
          if (!report) {
            // the only time the report goes falsy is when there are no report fetched for a certain month.
            return 0;
          }
          return report.reduce(
            (a, b) => a + Number(b['Daily User Installs']),
            0,
          );
        },
      );
      const total = monthlyTotal.reduce((a: number, b: number) => a + b, 0);
      yearlyReport[year] = { total, monthlyTotal };
    } catch (error) {
      // TODO add if-else for checking Google Play-specific error?
      // else fail silently and return empty report
    }

    return yearlyReport;
  }

  /**
   * Select appropriate key for prod or dev from config/keys/
   * DEV is allowed only if you know the config.json values (should not be git-committed).
   */
  private async getPrivateKey() {
    let privateKey = '';
    const hasRequiredConfiguration =
      this.config.clientEmail &&
      this.config.bucketId &&
      this.config.appPackageName;

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
          `/config/keys/googleplay.privatekey.${configEnv}.p12`,
        ),
      );
    }
    return privateKey;
  }

  private async getJWT() {
    const scopes = 'https://www.googleapis.com/auth/devstorage.read_only';
    const privateKey = await this.getPrivateKey();
    const jwt = new google.auth.JWT(
      this.config.clientEmail,
      null,
      privateKey,
      scopes,
    );
    return jwt;
  }

  private async parseCsv(csvString: string): Promise<GooglePlayReport[]> {
    try {
      const REGEX_UNKNOWN_CHARACTERS = /[\uFFFD\u0000]/g; // matches unknown encode characters
      csvString = csvString.replace(REGEX_UNKNOWN_CHARACTERS, '');
      return CSV().fromString(csvString); // fromString() is PromiseLike
    } catch (error) {
      GDExpectedException.throw(ReportsExceptions.googlePlayReportParseFailed);
    }
  }
}
