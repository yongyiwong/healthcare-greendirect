export const RANDOM_SEQUENCE_OPTION = 0;

export interface PromoBannerDto {
  id?: number;
  name?: string;
  bannerUrl?: string;
  bannerMobileUrl?: string;
  backgroundColor?: string;
  clickUrl?: string;
  isActive?: boolean;
  sequenceNumber?: number;
}
