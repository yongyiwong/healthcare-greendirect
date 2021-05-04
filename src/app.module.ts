import { MailerModule, PugAdapter } from '@nest-modules/mailer';
import {
  HttpService, LoggerService,
  MiddlewareConsumer,
  Module,
  NestModule, OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule, MailerConfigService } from '@sierralabs/nest-identity';
import {
  ConfigModule,
  ConfigService,
  PostgresNamingStrategy,
} from '@sierralabs/nest-utils';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { VersionHeaderMiddleware } from './common/middleware/version-header.middleware';
import { CampaignMonitorModule } from './campaign-monitor/campaign-monitor.module';
import { CouponModule } from './coupon/coupon.module';
import { DealModule } from './deal/deal.module';
import { DeliveryModule } from './delivery/delivery.module';
import { DoctorModule } from './doctor/doctor.module';
import { FormBusinessListingModule } from './form-business-listing/form-business-listing.module';
import { FormContactModule } from './form-contact/form-contact.module';
import { LocationModule } from './location/location.module';
import { MapsModule } from './maps/maps.module';
import { MessageModule } from './message/message.module';
import { MobileCheckInModule } from './mobile-check-in/mobile-check-in.module';
import { OrderModule } from './order/order.module';
import { OrganizationModule } from './organization/organization.module';
import { ProductModule } from './product/product.module';
import { ReportsModule } from './reports/reports.module';
import { RolesModule } from './roles/roles.module';
import { StateModule } from './state/state.module';
import { SynchronizeModule } from './synchronize/synchronize.module';
import { UserValidateStrategy } from './user';
import { UserLocationModule } from './user-location/user-location.module';
import { UserRoleModule } from './user-role/user-role.module';
import { UserModule } from './user/user.module';
import { BillingModule } from './billing/billing.module';
import { BrandModule } from './brand/brand.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { SiteMapModule } from './site-map/site-map.module';
import { PromoBannerModule } from './promo-banner/promo-banner.module';
import { SignInLinkModule } from './sign-in-link/sign-in-link.module';
import { DeployModule } from './deploy/deploy.module';
import { SearchModule } from './search/search.module';
import {GreenDirectLogger} from './greendirect-logger';
import { UserIdentificationModule } from './user-identification/user.idenfication.module';

const configService = new ConfigService();
const config = configService.get('database');
const mailConfigService = new MailerConfigService(configService);

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: config.type,
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      entities: [__dirname + '/entities/**.entity{.ts,.js}'],
      extra: {
        idleTimeoutMillis: config.poolIdleTimeout || undefined,
        max: config.poolMax,
        ssl: config.ssl,
      },
      // synchronize: true,
      // logging: 'all',
      namingStrategy: new PostgresNamingStrategy(),
    }),
    AuthModule.forRoot(UserValidateStrategy, [UserModule]),
    CampaignMonitorModule,
    DoctorModule,
    LocationModule,
    MapsModule,
    OrderModule,
    OrganizationModule,
    ProductModule,
    RolesModule,
    SiteSettingsModule,
    StateModule,
    SynchronizeModule,
    UserIdentificationModule,
    UserModule,
    UserLocationModule,
    UserRoleModule,
    CouponModule,
    FormBusinessListingModule,
    FormContactModule,
    ReportsModule,
    DeliveryModule,
    DealModule,
    BrandModule,
    MessageModule,
    SiteMapModule,
    PromoBannerModule,
    MobileCheckInModule,
    SignInLinkModule,
    BillingModule,
    DeployModule,
    SearchModule,
    MailerModule.forRootAsync({
      useFactory: () => {
        /* inherit mailConfigOptions but
          override "templateDir" with "template.dir" from
          latest nest-modules/mailer version opts */
        return {
          ...mailConfigService.createMailerOptions(),
          template: {
            dir: process.cwd() + configService.get('email.templateDir'),
            adapter: new PugAdapter(),
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule, OnModuleInit {

  private logger: LoggerService = new GreenDirectLogger('AppModule');

  constructor(private httpService: HttpService) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(VersionHeaderMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    } as any);
    // consumer.apply(RequestLoggerMiddleware).forRoutes({
    //   path: '*',
    //   method: RequestMethod.ALL,
    // } as any);
  }

  onModuleInit(): any {
    // Removing request/response logging as there are binary streams from MJ
    // this.httpService.axiosRef.interceptors.request.use(axiosRequestConfig => {
    //   this.logger.log(JSON.stringify(axiosRequestConfig));
    //   return axiosRequestConfig;
    // });
    // this.httpService.axiosRef.interceptors.response.use(axiosResponse => {
    //   this.logger.log(JSON.stringify(axiosResponse));
    //   return axiosResponse;
    // });
  }
}
