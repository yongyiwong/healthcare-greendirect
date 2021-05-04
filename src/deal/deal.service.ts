import { format, isDate, parse, isAfter } from 'date-fns';
import * as path from 'path';
import * as s3Proxy from 's3-proxy';
import * as log from 'fancy-log';
import * as _ from 'lodash';

import { DealPresignDto } from './deal-presign.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import {
  Deal,
  DEFAULT_TZ,
  RANDOM_PRIORITY_OPTION,
} from '../entities/deal.entity';
import { LocationDeal } from '../entities/location-deal.entity';
import { UserDeal } from '../entities/user-deal.entity';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@sierralabs/nest-utils';
import { GDExpectedException } from '../gd-expected.exception';
import { DealExceptions } from './deal.exceptions';
import {
  MailerNotification,
  NotificationMethod,
  TextMessageNotification,
} from '../notification/notification.service';
import { UserService } from '../user/user.service';
import { UserExceptions } from '../user/user.exceptions';
import { DealDay } from '../entities/deal-day.entity';
import {
  SearchParams,
  DEFAULT_PARAMS,
} from '../common/search-params.interface';
import { LocationService } from '../location';
import { countBy, map } from 'lodash';
import { OTHER_CATEGORY, SearchCountMapping } from '../common/search-count.dto';

@Injectable()
export class DealService {
  s3client: S3;
  public currentYear: number = new Date().getFullYear();

  constructor(
    @InjectRepository(Deal) protected readonly dealRepository: Repository<Deal>,
    @InjectRepository(LocationDeal)
    protected readonly locationDealRepository: Repository<LocationDeal>,
    @InjectRepository(UserDeal)
    protected readonly userDealRepository: Repository<UserDeal>,
    @InjectRepository(DealDay)
    protected readonly dealDayRepository: Repository<DealDay>,
    protected readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly locationService: LocationService,
  ) {
    const config = configService.get('storage.aws.s3');
    config.signatureVersion = 'v4'; // allow for browser upload
    this.s3client = new S3(config);
  }

  public async findWithFilter(
    searchParams?: SearchParams,
  ): Promise<[Deal[], number]> {
    const {
      search,
      page,
      limit,
      order,
      category,
      startDate,
      endDate,
      locationId,
      includeDeleted = false,
      includeUnassigned = false,
      includeInactiveDeals = false,
      excludeEnded = false,
      shuffleBaseValue,
    } = { ...DEFAULT_PARAMS, ...searchParams };

    const TABLE_NAME = 'deal';
    const offset = page * limit;

    try {
      const query = this.dealRepository
        .createQueryBuilder(TABLE_NAME)
        .leftJoinAndSelect(
          'deal.dealLocations',
          'dealLocations',
          'dealLocations.deleted = false',
        )
        .leftJoinAndSelect(
          'dealLocations.location',
          'location',
          'location.deleted = false',
        )
        .leftJoinAndSelect(
          'location.organization',
          'organization',
          'organization.deleted = false',
        )
        .leftJoin(
          'deal.dealDays',
          'dealDaysForFilter',
          'dealDaysForFilter.isActive = true',
        );

      if (search) {
        const filter = '%' + search + '%'; // wildcard search
        query.andWhere('deal.title ILIKE :filter', { filter });
      }

      if (category) {
        query.andWhere('deal.category = :category', {
          category,
        });
      }

      if (excludeEnded) {
        query.andWhere(
          `CASE WHEN deal.endDate IS NOT NULL THEN
              timezone(deal.timezone, current_timestamp) ::DATE <= deal.endDate ::DATE
            ELSE
              true
            END`,
        );
      } else if (startDate && endDate) {
        query.andWhere(
          `CASE WHEN deal.startDate IS NOT NULL AND deal.endDate IS NOT NULL THEN
            deal.startDate ::DATE BETWEEN :startDate ::DATE and :endDate ::DATE AND
            deal.endDate ::DATE BETWEEN :startDate ::DATE and :endDate ::DATE
          ELSE true END`,
          {
            startDate: new Date(+startDate),
            endDate: new Date(+endDate),
          },
        );
      } else if (startDate && !endDate) {
        query.andWhere(
          `CASE WHEN deal.startDate IS NOT NULL THEN
            deal.startDate ::DATE >= :startDate ::DATE
          ELSE
            true
          END`,
          { startDate: new Date(+startDate) },
        );
      } else if (!startDate && endDate) {
        query.andWhere(
          `CASE WHEN deal.endDate IS NOT NULL THEN
             deal.endDate ::DATE >= :endDate ::DATE
          ELSE
            true
          END`,
          { endDate: new Date(+endDate) },
        );
      } else {
        query.andWhere(
          `CASE WHEN deal.startDate IS NOT NULL AND deal.endDate IS NOT NULL THEN
            timezone(deal.timezone, current_timestamp) ::DATE
          BETWEEN
            deal.startDate ::DATE AND deal.endDate ::DATE
          ELSE
            true
          END`,
        );
      }

      if (!includeDeleted) {
        query.andWhere('deal.deleted = false');
      }

      if (!includeInactiveDeals) {
        query.andWhere(
          `(EXTRACT(DOW FROM current_date AT TIME ZONE 'UTC' AT TIME ZONE deal.timezone) = dealDaysForFilter.dayOfWeek
            OR dealDaysForFilter.isActive IS NULL)`,
        );
      }

      query.leftJoinAndSelect(
        'deal.dealDays',
        'dealDays',
        !includeInactiveDeals ? 'dealDays.isActive = true' : '',
      );

      if (!includeDeleted) {
        query.andWhere('deal.deleted = false');
      }

      if (locationId) {
        query.andWhere('dealLocations.location_id = :locationId', {
          locationId,
        });
      }

      if (!includeUnassigned) {
        // if not specified, by default we will exclude deals without locations (unusable to buyers)
        // specify this as true for CMS, for admin to work on incomplete deals.
        query
          .andWhere('dealLocations.deleted = false')
          .andWhere('location.deleted = false');
      }

      query.take(limit).skip(offset);

      const sequenceClause = `
        CASE
          WHEN ${TABLE_NAME}.priority = ${RANDOM_PRIORITY_OPTION} THEN NULL
          ELSE ${TABLE_NAME}.priority
        END`;

      if (order) {
        // TODO make this an OrderBy Pipe/ transformer?
        const key = Object.keys(order)[0];
        if (key === 'priority') {
          query.addSelect(sequenceClause, 'sequence');
          order[`sequence`] = {
            order: order[key],
            nulls: 'NULLS LAST',
          };
          order[`${TABLE_NAME}.created`] = 'DESC';
        } else {
          order[`${TABLE_NAME}.${key}`] = order[key];
        }
        delete order[key];
        query.orderBy(order);
      } else {
        query.addSelect(sequenceClause, 'sequence').orderBy('sequence', 'ASC');
        if (shuffleBaseValue) {
          const shuffleClause = `
            CASE
              WHEN ${TABLE_NAME}.priority = ${RANDOM_PRIORITY_OPTION} THEN
                (CAST(EXTRACT(EPOCH FROM ${TABLE_NAME}.modified) AS INTEGER) + ${TABLE_NAME}.id) % ${shuffleBaseValue}
              ELSE
                NULL
            END`;
          query
            .addSelect(shuffleClause, 'shuffle')
            .addOrderBy('shuffle', 'ASC');
        }
        query.addOrderBy(`${TABLE_NAME}.created`, 'DESC');
      }

      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  public async findById(id: number, locationId?: number): Promise<Deal> {
    try {
      const query = await this.dealRepository
        .createQueryBuilder('deal')
        .leftJoinAndSelect('deal.dealDays', 'dealDays')
        .leftJoinAndSelect(
          'deal.dealLocations',
          'dealLocations',
          'dealLocations.deleted = false',
        )
        .leftJoinAndSelect(
          'dealLocations.location',
          'location',
          'location.deleted = false',
        )
        .leftJoinAndSelect('location.organization', 'organization')
        .where('deal.id = :id', { id });

      if (locationId) {
        query.andWhere('dealLocations.location_id = :locationId', {
          locationId,
        });
      }

      const deal = await query.getOne();
      /**
       * This will filter deal locations with deleted location.
       */
      deal.dealLocations = deal.dealLocations.filter(
        dealLocation => dealLocation.location,
      );
      GDExpectedException.try(DealExceptions.dealNotFound, deal);
      return deal;
    } catch (error) {
      throw error;
    }
  }

  public async createDeal(deal: Deal): Promise<Deal> {
    delete deal.id;

    try {
      const result = await this.dealRepository.save(deal);

      if (deal.dealLocations && deal.dealLocations.length > 0) {
        result.dealLocations = await Promise.all(
          deal.dealLocations.map(async dealLocation => {
            dealLocation.deal = new Deal();
            dealLocation.deal.id = result.id;
            dealLocation.createdBy = deal.createdBy;
            dealLocation.modifiedBy = deal.modifiedBy;
            return this.createLocationDeal(dealLocation);
          }),
        );
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  public async updateDeal(deal: Deal): Promise<Deal> {
    delete deal.createdBy;
    delete deal.created;

    try {
      const result = await this.dealRepository.save(deal);
      if (deal.dealLocations && deal.dealLocations.length > 0) {
        result.dealLocations = await Promise.all(
          deal.dealLocations.map(async dealLocation => {
            dealLocation.deal = new Deal();
            dealLocation.deal.id = result.id;
            dealLocation.createdBy = deal.createdBy;
            dealLocation.modifiedBy = deal.modifiedBy;
            return this.saveLocationDeal(dealLocation);
          }),
        );
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async removeDeal(
    id: number,
    modifiedBy: number,
  ): Promise<UpdateResult> {
    try {
      return this.dealRepository.update({ id }, { deleted: true, modifiedBy });
    } catch (error) {
      throw error;
    }
  }

  public async getSearchCount(
    searchParams: SearchParams,
  ): Promise<SearchCountMapping> {
    const { search, category } = searchParams;

    if (!search || (category && !Number(category))) {
      return { count: 0 };
    }

    const [deals, count] = await this.findWithFilter({
      search,
      category,
      limit: null,
      page: null,
    });
    const categoryCounts = countBy(deals, 'category');
    const categories = map(categoryCounts, (value, categ) => ({
      [Number(categ) || OTHER_CATEGORY]: value,
    }));

    return {
      count,
      categories,
    };
  }

  public async claimDeal(
    dealId: number,
    userId: number,
    notifMethod: NotificationMethod,
  ): Promise<UserDeal> {
    try {
      const deal = await this.findById(dealId);
      GDExpectedException.try(DealExceptions.dealNotFound, deal);
      GDExpectedException.try(DealExceptions.dealHasExpired, deal);

      if (_.isEmpty(deal.dealLocations)) {
        // Dont allow claiming deals that have no locations to handle them
        GDExpectedException.throw(DealExceptions.dealNotFound);
      }

      if (notifMethod === NotificationMethod.SMS) {
        const user = await this.userService.findById(userId);
        GDExpectedException.try(UserExceptions.userNotVerified, user);
        GDExpectedException.try(DealExceptions.userHasNoMobileNumber, user);
      }

      /* Allow unlimited deal claiming for now. */
      // const userDeal = await this.userDealRepository.findOne({
      //   where: { user: userId, deal: dealId },
      // });
      // GDExpectedException.try(
      //   DealExceptions.dealAlreadyClaimedByUser,
      //   userDeal,
      // );

      const claimedUserDeal = {
        deal: { id: dealId },
        user: { id: userId },
        dateClaimed: new Date(), // now, server time (UTC).
      };
      const savedUserDeal = await this.userDealRepository.save(claimedUserDeal);
      return this.findUserDealById(savedUserDeal.id);
    } catch (error) {
      throw error;
    }
  }

  public async createPresignedPost(
    presignDto: DealPresignDto,
    expiration: number = 3600,
  ): Promise<any> {
    const PHOTO_TYPE = 'image';
    const timestamp = format(new Date(), 'YYYYMMDDHHmmss');
    let fileKey = `${presignDto.dealId}_${PHOTO_TYPE}_`;
    fileKey += timestamp + path.extname(presignDto.name);
    const config = this.configService.get('storage.aws.s3');
    const endpoint = this.configService.get('storage.endpoint');
    const params = {
      Bucket: config.bucket,
      Key: 'deals/' + fileKey,
      Expires: expiration,
    };
    return {
      destinationUrl: `${endpoint}/api/deals/photo/file/${fileKey}`,
      signedUrl: this.s3client.getSignedUrl('putObject', params),
    };
  }

  public proxyFile(fileKey: string, request, response, next) {
    request.originalUrl = '/deals/' + fileKey;
    const options = {
      ...this.configService.get('storage.aws.s3'),
    };
    s3Proxy(options)(request, response, error => {
      if (error && error.status === 404) {
        response.type('json');
        return next(new NotFoundException());
      }
      next(error);
    });
  }

  public async composeDealClaimedEmail(
    userDealId: number,
    locale: string = 'en-US',
  ) {
    // TODO: centralize this?
    const localedEmailSubject = {
      'en-US': 'Deal Claimed! ',
      'es-PR': 'Trato Reclamado! ',
    };
    const userDeal = await this.userDealRepository.findOne({
      where: { id: userDealId },
      relations: [
        'user',
        'deal',
        'deal.dealLocations',
        'deal.dealLocations.location',
      ],
    });
    const { user, deal } = userDeal;

    if (!user || !user.email) {
      log.error(
        `Error: No "to" email provided. Cannot send email to user: ${user.id}.`,
      );
    }

    const fromAddress = this.configService.get('email.deals'); // email address for deals
    if (!fromAddress) {
      log.error(
        'Error: no app email found in configuration. Please check your "email.from" config.',
      );
    }

    const baseUrl = this.configService.get('email.clientBaseUrl');

    const localizedExpirationDate = !isDate(parse(deal.expirationDate))
      ? ''
      : format(
          parse(deal.expirationDate).toLocaleString('en-US', {
            timeZone: deal.timezone,
          }),
          'MMMM DD YYYY',
        ) +
        ', ' +
        (deal.timezone || DEFAULT_TZ).split('/')[1].replace('_', ' '); // e.g., "April 23 2019, Puerto Rico"
    const email: MailerNotification = {
      subject: localedEmailSubject[locale] + ' - ' + deal.title,
      from: fromAddress,
      to: user.email,
      template: 'deal-claimed',
      context: {
        deal,
        baseUrl,
        dealExpirationDate: localizedExpirationDate,
        location: deal.dealLocations.length && deal.dealLocations[0].location,
        copyrightFooterText: `© ${this.currentYear} GreenDirect`,
      },
    };
    return email;
  }

  public composeClaimedDealSMS(
    deal: Deal,
    mobileNumber: string,
  ): TextMessageNotification {
    try {
      const localizedExpirationDate = format(
        parse(deal.expirationDate).toLocaleString('en-US', {
          timeZone: deal.timezone,
        }),
        'MM/DD/YY',
      );
      const DEAL_NAME_MAXLENGTH = 24;
      const dealTitle =
        deal.title.length >= DEAL_NAME_MAXLENGTH
          ? deal.title.slice(0, 20) + '...'
          : deal.title;

      // Note: message should only contain at most 140 characters to fit in one sending.
      const message =
        `Claimed! Green Direct deal: ${dealTitle.toUpperCase()} is good through ${localizedExpirationDate}. ` +
        'Present this in-store. Can’t be combined with other discounts.';

      const sms: TextMessageNotification = {
        phoneNumber: mobileNumber,
        message,
      };
      return sms;
    } catch (error) {
      throw error;
    }
  }

  public async findLocationDeal(
    dealId: number,
    locationId: number,
  ): Promise<LocationDeal> {
    try {
      return this.locationDealRepository.findOne({
        deal: { id: dealId },
        location: { id: locationId },
      });
    } catch (error) {
      throw error;
    }
  }

  public async saveLocationDeal(
    locationDeal: LocationDeal,
  ): Promise<LocationDeal> {
    try {
      const existingLocationDeal = await this.findLocationDeal(
        locationDeal.deal.id,
        locationDeal.location.id,
      );
      if (!existingLocationDeal) {
        return this.createLocationDeal(locationDeal);
      } else {
        locationDeal.id = existingLocationDeal.id;
        return this.updateLocationDeal(locationDeal);
      }
    } catch (error) {
      throw error;
    }
  }

  public async createLocationDeal(
    locationDeal: LocationDeal,
  ): Promise<LocationDeal> {
    delete locationDeal.id;
    try {
      return this.locationDealRepository.save(locationDeal);
    } catch (error) {
      throw error;
    }
  }

  public async updateLocationDeal(
    locationDeal: LocationDeal,
  ): Promise<LocationDeal> {
    delete locationDeal.createdBy;
    try {
      return this.locationDealRepository.save(locationDeal);
    } catch (error) {
      throw error;
    }
  }

  public async findUserDealById(userDealId: number): Promise<UserDeal> {
    try {
      return this.userDealRepository.findOne({
        where: { id: userDealId },
        relations: [
          'user',
          'deal',
          'deal.dealLocations',
          'deal.dealLocations.location',
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  public isDateEnded(date: Date): boolean {
    const dateFormat = 'YYYY-MM-DD';
    return isAfter(
      format(
        new Date().toLocaleString('en-US', { timeZone: DEFAULT_TZ }),
        dateFormat,
      ),
      format(date, dateFormat),
    );
  }

  public async checkCreateDeal(deal: Deal) {
    const isFormDealEnded = this.isDateEnded(deal.endDate);

    if (deal.dealLocations && !isFormDealEnded) {
      const locationIds = deal.dealLocations
        .filter(dealLocation => !dealLocation.deleted)
        .map(dealLocations => dealLocations.location.id);
      const hasReachedLimit = !_.isEmpty(
        await this.locationService.getReachedDealsLimit(null, locationIds),
      );
      GDExpectedException.try(
        DealExceptions.locationsReachedDealLimit,
        hasReachedLimit,
      );
    }
  }

  public async checkUpdateDeal(deal: Deal) {
    const { deleted = null, endDate = null } =
      (await this.findById(deal.id)) || {};
    const isSavedDealEnded = this.isDateEnded(endDate);
    const isFormDealEnded = this.isDateEnded(deal.endDate);

    if (deal.dealLocations && !deleted && !isSavedDealEnded) {
      const locationIds = deal.dealLocations
        .filter(dealLocation => !dealLocation.deleted)
        .map(dealLocations => dealLocations.location.id);

      if (!_.isEmpty(locationIds)) {
        const maxedLocations = await this.locationService.getReachedDealsLimit(
          null,
          locationIds,
        );
        const assignedLocations = await this.locationService.getReachedDealsLimit(
          deal.id,
        );
        const hasReachedLimit = !_.isEmpty(
          maxedLocations.filter(
            location =>
              !assignedLocations.find(
                assignedLocation =>
                  assignedLocation.organization.id === location.organization.id,
              ),
          ),
        );
        GDExpectedException.try(
          DealExceptions.locationsReachedDealLimit,
          hasReachedLimit,
        );
      }
    }

    if (
      (deal.endDate && isSavedDealEnded && !isFormDealEnded && !deleted) ||
      (deal.deleted === false && !isSavedDealEnded)
    ) {
      const hasReachedLimit = !_.isEmpty(
        await this.locationService.getReachedDealsLimit(deal.id),
      );
      GDExpectedException.try(
        DealExceptions.locationsReachedDealLimit,
        hasReachedLimit,
      );
    }
  }
}
