import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  getDay,
  addDays,
  addWeeks,
  subDays,
  isWithinRange,
  parse,
  format,
  isValid,
} from 'date-fns';

import {
  LocationHoursTodayDto,
  HourDto,
  HoursTodayDto,
  LocationDeliveryHourTodayDto,
} from '../dto/location-hour.dto';
import { LocationDeliveryHour } from '../../entities/location-delivery-hour.entity';
import { LocationHour } from '../../entities/location-hour.entity';
import { GDExpectedException } from '../../gd-expected.exception';
import { LocationExceptions } from '../location.exceptions';
import { Location } from '../../entities/location.entity';
import { Organization } from '../../entities/organization.entity';

@Injectable()
export class HoursService {
  constructor(
    @InjectRepository(LocationHour)
    protected readonly hourRepository: Repository<LocationHour>,
    @InjectRepository(LocationDeliveryHour)
    protected readonly deliveryHourRepository: Repository<LocationDeliveryHour>,
  ) {}

  public async getLocationHours(locationId: number) {
    return await this.hourRepository.find({
      where: { location: locationId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  public async getLocationHour(
    locationId: number,
    dayOfWeek: number,
  ): Promise<LocationHour> {
    let result = null;
    try {
      result = await this.hourRepository
        .createQueryBuilder('hour')
        .where('hour.location_id = :locationId', { locationId })
        .andWhere('hour.dayOfWeek = :dayOfWeek', {
          dayOfWeek,
        })
        .getOne();
    } catch (error) {
      throw error;
    }
    return new Promise<LocationHour>(resolve => resolve(result));
  }

  public async createLocationHour(
    locationHour: LocationHour,
  ): Promise<LocationHour> {
    let result = null;
    delete locationHour.id;
    try {
      result = await this.hourRepository.save(locationHour);
    } catch (error) {
      throw error;
    }
    return new Promise<LocationHour>(resolve => resolve(result));
  }

  public async updateLocationHour(locationHour: LocationHour) {
    let result = null;
    delete locationHour.createdBy;
    try {
      result = await this.hourRepository.save(locationHour);
    } catch (error) {
      throw error;
    }
    return new Promise<LocationHour>(resolve => resolve(result));
  }

  public async saveLocationHours(
    locationHours: LocationHour[],
  ): Promise<LocationHour[]> {
    let hours = [];
    try {
      this.validateLocationHours(locationHours);
      hours = await Promise.all(
        locationHours.map(async hour => {
          const hourData = await this.getLocationHour(
            hour.location.id,
            hour.dayOfWeek,
          );
          hour.startTime = hour.startTime || null;
          hour.endTime = hour.endTime || null;
          if (hourData) {
            hour.id = hourData.id;
            return await this.updateLocationHour(hour);
          } else {
            return await this.createLocationHour(hour);
          }
        }),
      );
    } catch (error) {
      throw error;
    }
    return new Promise<LocationHour[]>(resolve => resolve(hours));
  }

  validateLocationHours(locationHours: LocationHour[]) {
    const DATE_FORMAT = 'YYYY-MM-DD';
    try {
      locationHours.forEach(hour => {
        const nowStart = format(new Date(), DATE_FORMAT) + ' ' + hour.startTime;
        const nowEnd = format(new Date(), DATE_FORMAT) + ' ' + hour.endTime;
        if (hour.startTime && (!isValid(new Date(nowStart)) || !hour.endTime)) {
          GDExpectedException.throw(LocationExceptions.invalidTime);
        }
        if (hour.endTime && (!isValid(new Date(nowEnd)) || !hour.startTime)) {
          GDExpectedException.throw(LocationExceptions.invalidTime);
        }
        if (hour.isOpen && (!hour.startTime || !hour.endTime)) {
          GDExpectedException.throw(LocationExceptions.invalidTime);
        }
        if (hour.startTime && hour.endTime && hour.startTime >= hour.endTime) {
          GDExpectedException.throw(LocationExceptions.invalidTimeRange);
        }
      });
    } catch (error) {
      throw error;
    }
  }

  public async saveLocationDeliveryHours(
    deliveryHours: LocationDeliveryHour[],
  ): Promise<LocationDeliveryHour[]> {
    try {
      this.validateLocationDeliveryHours(deliveryHours);
      return Promise.all(
        deliveryHours.map(async hour => {
          const hourData = await this.getLocationDeliveryHour(
            hour.location.id,
            hour.dayOfWeek,
          );
          hour.startTime = hour.startTime || null;
          hour.endTime = hour.endTime || null;
          if (hourData) {
            hour.id = hourData.id;
            return this.updateLocationDeliveryHour(hour);
          } else {
            return this.createLocationDeliveryHour(hour);
          }
        }),
      );
    } catch (error) {
      throw error;
    }
  }

  validateLocationDeliveryHours(deliveryHours: LocationDeliveryHour[]) {
    const DATE_FORMAT = 'YYYY-MM-DD';
    try {
      deliveryHours.forEach(hour => {
        const nowStart = format(new Date(), DATE_FORMAT) + ' ' + hour.startTime;
        const nowEnd = format(new Date(), DATE_FORMAT) + ' ' + hour.endTime;
        if (hour.startTime && (!isValid(new Date(nowStart)) || !hour.endTime)) {
          GDExpectedException.throw(LocationExceptions.invalidTime);
        }
        if (hour.endTime && (!isValid(new Date(nowEnd)) || !hour.startTime)) {
          GDExpectedException.throw(LocationExceptions.invalidTime);
        }
        if (hour.isOpen && (!hour.startTime || !hour.endTime)) {
          GDExpectedException.throw(LocationExceptions.invalidTime);
        }
        if (hour.startTime && hour.endTime && hour.startTime >= hour.endTime) {
          GDExpectedException.throw(LocationExceptions.invalidTimeRange);
        }
      });
    } catch (error) {
      throw error;
    }
  }

  public getHoursToday(
    location: Location,
    opensAtFormat = 'ddd hh:mm A',
    closesAtFormat = 'hh:mm A',
  ): LocationHoursTodayDto {
    if (!location) return null;
    const { timezone, hours } = location;
    if (!timezone || !hours || !hours.length) return null;
    const localized = parse(
      new Date().toLocaleString('en-US', { timeZone: timezone }),
    );
    const today = getDay(localized);
    const dayNow = hours.find(h => h.dayOfWeek === today && h.isOpen);
    // predict next opening day, hours already ordered by day of week
    const dayNext =
      hours.find(h => h.dayOfWeek > today && h.isOpen) ||
      hours.find(h => h.dayOfWeek < today && h.isOpen);
    const dayNowLocal = dayNow
      ? this.convertHoursToHoursToday(
          dayNow,
          localized,
          opensAtFormat,
          closesAtFormat,
        )
      : null;
    const dayNextLocal = dayNext
      ? this.convertHoursToHoursToday(
          dayNext,
          localized,
          opensAtFormat,
          closesAtFormat,
        )
      : null;

    // TODO add verification against location.holidays? (closed if holiday)
    const timeNow = format(localized, 'HH:mm:ss');
    const organization = location.organization || ({} as Organization);

    const isOpenNow = dayNowLocal && dayNowLocal.isOpen;
    const isBeforeHours = !isOpenNow && dayNow && timeNow < dayNow.startTime;
    const isOpenToday = !!(dayNow && dayNow.isOpen);

    const hoursToday =
      isOpenNow || isBeforeHours ? { ...dayNowLocal } : { ...dayNextLocal };
    hoursToday.isOffHours =
      !isOpenNow &&
      isOpenToday &&
      !!organization.allowOffHours &&
      location.allowOffHours;

    return hoursToday;
  }

  private convertHoursToHoursToday(
    hours: HourDto,
    dateToday: Date,
    opensAtFormat: string,
    closesAtFormat: string,
  ): HoursTodayDto {
    if (!hours) return null; // fallback for null to continue from crash.
    const DATE_FORMAT = 'YYYY-MM-DD'; // for consistency, irrevelant when turned into Date obj
    const today = getDay(dateToday);

    // Today's applicable hours
    let dateLocal = null;
    if (hours.dayOfWeek === today) {
      dateLocal = format(dateToday, DATE_FORMAT);
    } else if (hours.dayOfWeek > today) {
      dateLocal = addDays(dateToday, hours.dayOfWeek - today);
    } else {
      dateLocal = addWeeks(subDays(dateToday, today - hours.dayOfWeek), 1);
    }
    // use strings for comparison of local hours
    const startDate = format(dateLocal, DATE_FORMAT) + ' ' + hours.startTime;
    const endDate = format(dateLocal, DATE_FORMAT) + ' ' + hours.endTime;
    const isOpen = hours.isOpen
      ? isWithinRange(dateToday, startDate, endDate)
      : false;
    const hoursToday: HoursTodayDto = {
      isOpen,
      opensAt: format(startDate, opensAtFormat),
      closesAt: format(endDate, closesAtFormat),
    };
    return hoursToday;
  }

  public async getLocationDeliveryHours(locationId: number) {
    return await this.deliveryHourRepository.find({
      where: { location: locationId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  public async getLocationDeliveryHour(
    locationId: number,
    dayOfWeek: number,
  ): Promise<LocationDeliveryHour> {
    let result = null;
    try {
      result = await this.deliveryHourRepository
        .createQueryBuilder('deliveryHour')
        .where('deliveryHour.location_id = :locationId', { locationId })
        .andWhere('deliveryHour.dayOfWeek = :dayOfWeek', {
          dayOfWeek,
        })
        .getOne();
      return Promise.resolve(result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves only today's hours without checking next open schedule.
   * @param location
   * @param opensAtFormat
   * @param closesAtFormat
   */
  public getLocationDeliveryHoursToday(
    location: any,
    opensAtFormat = 'ddd hh:mm A',
    closesAtFormat = 'hh:mm A',
  ): LocationDeliveryHourTodayDto {
    if (!location) return null;
    const { timezone, deliveryHours } = location;
    if (!timezone || !deliveryHours || !deliveryHours.length) return null;
    const localized = parse(
      new Date().toLocaleString('en-US', { timeZone: timezone }),
    );
    const today = getDay(localized);
    const dayNow = deliveryHours.find(h => h.dayOfWeek === today);

    const dayNowLocal = dayNow
      ? this.convertHoursToHoursToday(
          dayNow,
          localized,
          opensAtFormat,
          closesAtFormat,
        )
      : null;

    // TODO add verification against location.holidays? (closed if holiday)
    return dayNowLocal;
  }

  public async createLocationDeliveryHour(
    deliveryHour: LocationDeliveryHour,
  ): Promise<LocationDeliveryHour> {
    let result = null;
    delete deliveryHour.id;
    try {
      result = await this.deliveryHourRepository.save(deliveryHour);
    } catch (error) {
      throw error;
    }
    return Promise.resolve(result);
  }

  public async updateLocationDeliveryHour(
    locationDeliveryHour: LocationDeliveryHour,
  ) {
    let result = null;
    delete locationDeliveryHour.createdBy;
    try {
      result = await this.deliveryHourRepository.save(locationDeliveryHour);
    } catch (error) {
      throw error;
    }
    return Promise.resolve(result);
  }
}
