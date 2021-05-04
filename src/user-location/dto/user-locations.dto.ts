import { Location } from '../../entities/location.entity';
import { User } from '../../entities/user.entity';

export interface UserLocationsDto {
  id: number;
  user: User;
  location: Location;
  created: Date;
  createdBy: number;
  modified: Date;
  modifiedBy: number;
}
