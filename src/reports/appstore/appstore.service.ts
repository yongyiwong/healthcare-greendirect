import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Client as AppStoreConnectClient,
  DownloadSalesReportFrequency,
  GetAppDownloadsOptions,
  Client,
} from '@egodigital/appstore-connect';
import { differenceInMonths, format, getMonth, getYear } from 'date-fns';
import { range, sum } from 'lodash';
import { ConfigService } from '@sierralabs/nest-utils';
import { Repository } from 'typeorm';

import { GDExpectedException } from '../../gd-expected.exception';
import { ReportsExceptions } from '../reports.exceptions';
import { AnnualMonthlyTotalDto } from '../dto/annual-monthly-total.dto';
import {
  isProductionEnv,
  Environments,
  readFromFileAsync,
} from '../../app.service';
import { AppDownload } from '../../entities/app-download.entity';
import { Platform } from '../app-platform.enum';

export interface AppStoreConnectConfig {
  appSKU: string;
  apiKey: string;
  issuerId: string;
  vendorNumber: string;
}

@Injectable()
export class AppStoreService {
  config = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AppDownload)
    private readonly appDownloadRepository: Repository<AppDownload>,
  ) {
    this.config = configService.get('analytics.appstore');
  }

  async listDownloads(year: number): Promise<AnnualMonthlyTotalDto> {
    const { apiKey, issuerId } = this.config;
    const privateKey = await this.getPrivateKey();
    // Needs to be regenerated everytime due to 20-min lifetime of jwt
    const client: Client = new AppStoreConnectClient({
      apiKey,
      issuerId,
      privateKey,
    });

    const { vendorNumber, appSKU } = this.config;
    const opts: GetAppDownloadsOptions = {
      vendorId: vendorNumber,
    };

    GDExpectedException.try(ReportsExceptions.reportYearInvalid, year);
    // check that have a client to use
    GDExpectedException.try(ReportsExceptions.appstoreReportMisconfigured, {
      client,
      config: this.config,
      privateKey,
    });

    let yearTotal;
    try {
      yearTotal = await client.getAppDownloads({
        ...opts,
        frequency: DownloadSalesReportFrequency.Yearly,
        date: `${year}`,
      } as GetAppDownloadsOptions);
    } catch (e) {
      // Fail third-party call silently and return an empty DTO below.
    }

    try {
      const appDownloads = await this.appDownloadRepository
        .createQueryBuilder('appDownload')
        .where('appDownload.year =:year', { year })
        .andWhere('appDownload.platform = :platform', {
          platform: Platform.IOS,
        })
        .getMany();

      const months = range(0, 12); // 0 - 11
      const monthlyTotal = months.map(month => {
        const monthlyDownload = appDownloads.find(
          appDownload => appDownload.month === month + 1,
        );
        return (monthlyDownload && monthlyDownload.downloads) || 0;
      });

      const total =
        (yearTotal &&
          yearTotal.apps[appSKU] &&
          yearTotal.apps[appSKU].downloads) ||
        sum(monthlyTotal) ||
        0;

      return {
        [year]: {
          total,
          monthlyTotal,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Select appropriate key for prod or dev from config/keys/
   * DEV is allowed only if you know the config.json values (should not be git-committed).
   */
  private async getPrivateKey() {
    let privateKey = '';
    const hasRequiredConfiguration =
      this.config.apiKey &&
      this.config.issuerId &&
      this.config.vendorNumber &&
      this.config.appSKU;

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
          `/config/keys/appstore_authkey.${configEnv}.p8`,
        ),
      );
    }
    return privateKey;
  }

  public async archiveDownloads(): Promise<void> {
    try {
      const { apiKey, issuerId } = this.config;
      const privateKey = await this.getPrivateKey();
      // Needs to be regenerated everytime due to 20-min lifetime of jwt
      const client: Client = new AppStoreConnectClient({
        apiKey,
        issuerId,
        privateKey,
      });
      const { vendorNumber, appSKU } = this.config;
      const opts: GetAppDownloadsOptions = {
        vendorId: vendorNumber,
      };

      // check that have a client to use
      GDExpectedException.try(ReportsExceptions.appstoreReportMisconfigured, {
        client,
        config: this.config,
        privateKey,
      });

      const latestDate = await this.getLatestDownloadDate();
      const now = new Date();
      const latestCurrentDateDiff = latestDate
        ? Math.abs(differenceInMonths(latestDate, now))
        : 12 + 1; // Default: before 12 months of the current month

      GDExpectedException.try(
        ReportsExceptions.appstoreMonthlyReportNotReady,
        latestCurrentDateDiff,
      );

      // If the previous month is available, do not archive current month
      if (latestCurrentDateDiff === 1) {
        return;
      }

      // Get analytics data form AppstoreConnect
      const downloadCountPromises = range(1, latestCurrentDateDiff).map(
        index => {
          const pastDate = new Date(
            now.getFullYear(),
            now.getMonth() - index,
            1,
          );
          return client.getAppDownloads({
            ...opts,
            frequency: DownloadSalesReportFrequency.Monthly,
            date: format(
              new Date(getYear(pastDate), getMonth(pastDate), 1),
              'YYYY-MM',
            ),
          } as GetAppDownloadsOptions);
        },
      );
      const downloadCounts = await Promise.all(downloadCountPromises);

      // Save analytics count to GD database
      const appDownloads = downloadCounts.map(({ apps = null }, index) => {
        const past = new Date(
          now.getFullYear(),
          now.getMonth() - (index + 1),
          1,
        );
        return {
          platform: Platform.IOS,
          downloads: (apps[appSKU] && apps[appSKU].downloads) || 0,
          year: getYear(past),
          month: getMonth(past) + 1,
        };
      });
      await this.appDownloadRepository.save(appDownloads);
    } catch (error) {
      const { appstoreTOSAgreementRequired, reportGone } = ReportsExceptions;
      GDExpectedException.try(reportGone, error);
      GDExpectedException.try(appstoreTOSAgreementRequired, error);

      // still throw unexpected errors
      throw error;
    }
  }

  private async getLatestDownloadDate(): Promise<Date> {
    try {
      const result: { maxDate: Date } = await this.appDownloadRepository
        .createQueryBuilder('appDownload')
        .select(
          `MAX(
            CONCAT(appDownload.year, '-', appDownload.month, '-', 01)::Date
          ) as "maxDate"`,
        )
        .where('appDownload.platform = :platform', { platform: Platform.IOS })
        .getRawOne();
      return result.maxDate ? new Date(result.maxDate) : null;
    } catch (error) {
      throw error;
    }
  }
}
