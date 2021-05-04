import { Client } from '@egodigital/appstore-connect';
import { HttpStatus } from '@nestjs/common';
import { isValid, isPast, addDays, startOfMonth } from 'date-fns';
import { isEmpty, inRange } from 'lodash';
import { AppStoreConnectConfig } from './appstore/appstore.service';
import { GooglePlayConfig } from './google-play/google-play.service';
import { GoogleAnalyticsConfig } from './google-analytics/google-analytics.service';
import { OrderReportParams } from './params/order-params.interface';
import { ExpectedExceptionMap } from '../app.interface';

export const ReportsExceptions: ExpectedExceptionMap = {
  locationRequired: {
    message: 'Error: Please select a location.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (params: OrderReportParams) =>
      !params.locationId && !params.allLocations,
  },
  ordersReportGenerationFailed: {
    message:
      'Error: There was a problem retrieving the orders. Please contact Support.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  reportYearInvalid: {
    message: 'Please provide a valid year.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (year: number) => !year || !isValid(new Date(year, 1, 1)),
  },
  reportMonthInvalid: {
    message: 'Please provide a valid month.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (month: number) => !inRange(month, 0, 12),
  },
  reportNumberOfMonthsAgoInvalid: {
    message: 'Invalid months back. It should answer how many months back.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (month: number) => !inRange(month, 1, 13),
  },
  reportGone: {
    message:
      'Report failed to download from the store or is no longer available.',
    httpStatus: HttpStatus.GONE,
    failCondition: error => {
      return /^Unexpected Response/.test(error.message);
    },
  },
  appstoreReportMisconfigured: {
    message: 'AppStoreConnect service seems to be misconfigured.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (args: {
      client: Client;
      config: AppStoreConnectConfig;
      privateKey: string;
    }) =>
      isEmpty(args.config) ||
      !args.config.appSKU ||
      !args.config.apiKey ||
      !args.config.issuerId ||
      !args.config.vendorNumber ||
      !args.privateKey ||
      !args.client,
  },
  appstoreTOSAgreementRequired: {
    message: `App Store has updated their license agreement
and is rejecting API requests while agreement is pending.
Please contact your Apple account holder to review and accept the updated agreement.`,
    httpStatus: HttpStatus.FORBIDDEN,
    failCondition: error =>
      error.message &&
      JSON.stringify(error.message).includes(
        'the Account Holder must agree to the latest Program License Agreement',
      ),
  },
  /**
   * Check whether the previous month's report is still not available.
   * Monthly reports are available five days after the end of the month
   * Ref: https://help.apple.com/app-store-connect/#/dev8a5831138
   */
  appstoreMonthlyReportNotReady: {
    message: `AppStore report not yet ready. Retry later 5 days after end of the month.`,
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    failCondition: latestCurrentDateDiff =>
      latestCurrentDateDiff === 2 &&
      !isPast(addDays(startOfMonth(Date.now()), 5)),
  },
  googlePlayMisconfigured: {
    message:
      'Google Play service seems to be misconfigured. Please contact your GD server administrator.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (config: GooglePlayConfig) =>
      isEmpty(config) ||
      !config.clientEmail ||
      !config.bucketId ||
      !config.appPackageName,
  },
  googleAnalyticsMisconfigured: {
    message:
      'Google Analytics service seems to be misconfigured. Please contact your GD server administrator.',
    httpStatus: HttpStatus.NOT_FOUND,
    failCondition: (config: GoogleAnalyticsConfig) =>
      isEmpty(config) || !config.clientEmail || !config.viewId,
  },
  googlePlayUnauthorized: {
    message:
      'Error: Google Play API failed to authorize. Please contact your GD server administrator.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    failCondition: jwt => !jwt,
  },
  googlePlayReportParseFailed: {
    message:
      'Error: There was a problem parsing the report data from Google Play.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    failCondition: jwt => !jwt,
  },
};
