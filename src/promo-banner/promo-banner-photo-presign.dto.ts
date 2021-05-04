import { FileItemType } from '../common/file-item-type.dto';

export interface PromoBannerPhotoPresignDto {
  bannerId: number;
  type: FileItemType;
  name: string;
}
