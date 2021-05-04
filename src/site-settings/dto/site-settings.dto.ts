export interface SiteSettingsDto {
  siteBanner?: {
    enUS: string;
    esPR: string;
    isActive: boolean;
  };
  // add additional site settings to DTO as needed
}

export interface SiteSettingsUpsertDto {
  siteBannerIsActive?: string;
  siteBannerenUS?: string;
  siteBanneresPR?: string;
}
