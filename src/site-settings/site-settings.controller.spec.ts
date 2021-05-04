import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';

describe('SiteSettings Controller', () => {
  let module: TestingModule;
  let siteSettingsController: SiteSettingsController;
  let siteSettingsService: SiteSettingsService;
  let userService: UserService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
      providers: [SiteSettingsService],
    }).compile();
    siteSettingsController = module.get<SiteSettingsController>(
      SiteSettingsController,
    );
    siteSettingsService = module.get<SiteSettingsService>(SiteSettingsService);
    userService = module.get<UserService>(UserService);
  });
  it('should be defined', () => {
    const controller: SiteSettingsController = module.get<
      SiteSettingsController
    >(SiteSettingsController);
    expect(controller).toBeDefined();
  });

  describe('Site Settings Unit Tests Happy Path', () => {
    let admin;
    let setMessage;
    beforeAll(async () => {
      admin = await userService.findByEmail('admin_e2e@isbx.com');
      setMessage = {
        siteBannerIsActive: 'true',
        siteBannerenUS: 'New test message in English',
        siteBanneresPR: 'New test message en Espanol',
      };
    });

    it('should set site settings siteBanner', async () => {
      const siteSettingsResult = await siteSettingsService.upsertSiteSettings(
        admin.id,
        setMessage,
      );
      expect(siteSettingsResult).toBeTruthy();
      expect(siteSettingsResult[0]).toHaveProperty('key');
      expect(siteSettingsResult[1]).toHaveProperty('value');
      expect(siteSettingsResult[2]).toHaveProperty('createdBy');
    });
  });

  it('should get site settings', async () => {
    const siteSettingResult = await siteSettingsService.getSiteSettings();
    expect(siteSettingResult).toBeTruthy();
    expect(siteSettingResult).toHaveProperty('siteBanner');
    expect(siteSettingResult.siteBanner).toHaveProperty('enUS');
  });
});
