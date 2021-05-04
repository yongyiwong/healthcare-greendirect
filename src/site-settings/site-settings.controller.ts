import { Body, Controller, Get, Post, Req, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiUseTags } from '@nestjs/swagger';
import { Roles } from '@sierralabs/nest-identity';
import { ParseEntityPipe, RequiredPipe } from '@sierralabs/nest-utils';

import { SiteSettings } from '../entities/site-settings.entity';
import { RoleEnum } from '../roles/roles.enum';
import {
  SiteSettingsDto,
  SiteSettingsUpsertDto,
} from './dto/site-settings.dto';
import { SiteSettingsService } from './site-settings.service';

const { Admin } = RoleEnum;

@ApiBearerAuth()
@ApiUseTags('Site Settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  public async getSiteSettings(): Promise<SiteSettingsDto> {
    return this.siteSettingsService.getSiteSettings();
  }

  @Roles(Admin)
  @Post()
  public async setSiteSettings(
    @Req() request,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    siteSettings: SiteSettingsUpsertDto,
  ): Promise<SiteSettings[]> {
    const userId = request.user.id;
    return this.siteSettingsService.upsertSiteSettings(userId, siteSettings);
  }
}
