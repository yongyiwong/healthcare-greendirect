import {
  Controller,
  Get,
  Post,
  Res,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
import { format } from 'date-fns';
import { ParseBooleanPipe } from '@sierralabs/nest-utils';

import { Roles } from '@sierralabs/nest-identity';
import { RoleEnum } from '../roles/roles.enum';
import { OrderReportParams } from './params/order-params.interface';
import { LocationService } from '../location';
import { ReportsService, OrdersStatsDto } from './reports.service';
import { ReportsExceptions } from './reports.exceptions';
import { GDExpectedException } from '../gd-expected.exception';
import { LocationExceptions } from '../location/location.exceptions';
import { ReportDownloadGuard } from './report-download.guard';
import { AppStoreService } from './appstore/appstore.service';
import { GooglePlayService } from './google-play/google-play.service';
import { GoogleAnalyticsService } from './google-analytics/google-analytics.service';
import { AnnualMonthlyTotalDto } from './dto/annual-monthly-total.dto';
import { ActiveTimePeriod } from './dto/active-time-period.enum';
import { Platform } from './app-platform.enum';

const { Admin, SiteAdmin, Employee } = RoleEnum;

@ApiBearerAuth()
@ApiUseTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly locationService: LocationService,
    private readonly googleAnalyticsService: GoogleAnalyticsService,
    private readonly appstoreService: AppStoreService,
    private readonly googlePlayService: GooglePlayService,
  ) {}

  /**
   * Query @param userId - currently logged-in user's id (roles to be queried via userId)
   * and @param accessToken
   * are used for security verification in ReportDownloadGuard
   */
  @Get('orders-csv')
  @UseGuards(ReportDownloadGuard)
  @ApiImplicitQuery({ name: 'locationId', required: false })
  @ApiImplicitQuery({ name: 'modifiedFrom', required: false })
  @ApiImplicitQuery({ name: 'modifiedTo', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async getCsv(
    @Res() res,
    @Query('locationId', new ParseIntPipe()) locationId: number,
    @Query('modifiedDateFrom', new ParseIntPipe()) modifiedDateFrom: number,
    @Query('modifiedDateTo', new ParseIntPipe()) modifiedDateTo: number,
    @Query('allLocations', new ParseBooleanPipe()) allLocations: boolean,
  ) {
    try {
      const params: OrderReportParams = {
        locationId,
        modifiedDateFrom: new Date(modifiedDateFrom),
        modifiedDateTo: new Date(modifiedDateTo),
        allLocations,
      };
      GDExpectedException.try(ReportsExceptions.locationRequired, params);

      const location = locationId
        ? await this.locationService.findById(locationId, allLocations)
        : allLocations
        ? { name: 'ALL' }
        : null;
      GDExpectedException.try(LocationExceptions.locationNotFound, location);

      const filename =
        'orders_' +
        (location.name ? encodeURIComponent(location.name) : locationId) +
        '_' +
        format(params.modifiedDateFrom, 'YYYY-MMM-DD') +
        '-' +
        format(params.modifiedDateTo, 'YYYY-MMM-DD') +
        '.csv';

      const csvStream = await this.reportsService.generateOrdersReport(params);

      // If no exceptions were caught during report generation, let's wrap up the response stream
      // into a CSV stream
      res.append('Content-Type', 'text/csv');
      res.append('Content-Disposition', `attachment; filename="${filename}"`);
      csvStream.pipe(res);
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get('web/users')
  @ApiImplicitQuery({ name: 'year', required: true })
  public async getTotalUsers(@Query('year', new ParseIntPipe()) year: number) {
    return this.googleAnalyticsService.getTotalUsers(year);
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get('web/active-users')
  @ApiImplicitQuery({ name: 'year', required: false })
  @ApiImplicitQuery({ name: 'month', required: false })
  @ApiImplicitQuery({ name: 'activeTimePeriod', required: false })
  public async getActiveUsers(
    @Query('year', new ParseIntPipe()) year: number,
    @Query('month', new ParseIntPipe()) month: number,
    @Query('activeTimePeriod') activeTimePeriod: ActiveTimePeriod,
  ) {
    const monthZeroBased = month - 1;
    return this.googleAnalyticsService.getActiveUsers(
      year,
      monthZeroBased,
      activeTimePeriod,
    );
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get('web/get-orders-stats')
  @ApiImplicitQuery({ name: 'year', required: true })
  @ApiImplicitQuery({ name: 'month', required: false })
  @ApiImplicitQuery({ name: 'numberOfMonthsAgo', required: false })
  public async getOrdersStats(
    @Query('year', new ParseIntPipe()) year: number,
    @Query('month') month?: number,
    @Query('numberOfMonthsAgo') numberOfMonthsAgo?: number,
  ): Promise<OrdersStatsDto> {
    const monthZeroBased = month - 1;
    return this.reportsService.getOrdersStats(
      year,
      monthZeroBased,
      numberOfMonthsAgo,
    );
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get('web/get-orders-stats-annual')
  @ApiImplicitQuery({ name: 'year', required: true })
  public async getOrdersStatsAnnual(
    @Query('year', new ParseIntPipe()) year: number,
  ): Promise<OrdersStatsDto> {
    const monthZeroBased = 11;
    const numberOfMonthsAgo = 12;
    return this.reportsService.getOrdersStats(
      year,
      monthZeroBased,
      numberOfMonthsAgo,
      true,
    );
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get('app/downloads')
  @ApiImplicitQuery({ name: 'year', required: true })
  @ApiImplicitQuery({ name: 'platform', required: true })
  public async getDownloadsCount(
    @Query('year', new ParseIntPipe()) year: number,
    @Query('platform') platform: Platform = Platform.IOS,
  ): Promise<AnnualMonthlyTotalDto> {
    try {
      let result = null;
      if (platform === Platform.ANDROID) {
        result = await this.googlePlayService.getGooglePlayReport(year);
      } else {
        result = await this.appstoreService.listDownloads(year);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Post('app/archive-downloads')
  @ApiImplicitQuery({ name: 'platform', required: true })
  public async archiveDownloads(
    @Query('platform') platform: Platform = Platform.IOS,
  ): Promise<void> {
    let result = null;
    if (platform === Platform.ANDROID) {
    } else {
      result = await this.appstoreService.archiveDownloads();
    }
    return result;
  }
}
