import { MobileCheckIn } from '../entities/mobile-check-in.entity';

export interface MobileCheckInDto extends Partial<MobileCheckIn> {
  locationId: number;
}
