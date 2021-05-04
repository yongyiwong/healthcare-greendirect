import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SiteSettings } from '../entities/site-settings.entity';
import {
  SiteSettingsDto,
  SiteSettingsUpsertDto,
} from './dto/site-settings.dto';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    protected readonly siteSettingsRepository: Repository<SiteSettings>,
  ) {}

  public async getSiteSettings(): Promise<SiteSettingsDto> {
    try {
      const settingsResult = await this.siteSettingsRepository
        .createQueryBuilder('site_settings')
        .select(['key', 'value'])
        .getRawMany();

      const settingsObject = settingsResult.reduce(
        (obj, item) => ((obj[item.key] = item.value), obj),
        {},
      );
      const siteSettings: SiteSettingsDto = {
        siteBanner: {
          enUS: settingsObject.siteBannerenUS,
          esPR: settingsObject.siteBanneresPR,
          isActive: settingsObject.siteBannerIsActive === '1',
        },
      };

      return siteSettings;
    } catch (error) {
      throw error;
    }
  }

  public async upsertSiteSettings(
    userId: number,
    siteSettings: SiteSettingsUpsertDto,
  ): Promise<SiteSettings[]> {
    const settingsArray = Object.keys(siteSettings).map(item => ({
      key: item,
      value: siteSettings[item],
      createdBy: userId,
      modifiedBy: userId,
    }));

    try {
      return this.siteSettingsRepository.save(settingsArray);
    } catch (error) {
      throw error;
    }
  }
}
