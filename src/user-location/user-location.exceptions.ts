import { HttpStatus } from '@nestjs/common';
import { ExpectedExceptionMap } from '../app.interface';
import { User } from '../entities/user.entity';
import { Location } from '../entities/location.entity';
import { RoleEnum } from '../roles/roles.enum';
import { UserLocation } from '../entities/user-location.entity';

export const UserLocationExceptions: ExpectedExceptionMap = {
  notAssignedToLocation: {
    message: 'You are not authorized for this location.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    /**
     * failCondition: (context) = check user-assigned locations includes this location
     */
    failCondition: (context: {
      user: User;
      currentLocationId: number | null;
      userAssignedLocations: UserLocation[];
    }): boolean => {
      const { user, currentLocationId, userAssignedLocations } = context;

      if (user.roles[0].name === RoleEnum.Admin) {
        return false;
      }

      // allow when location to be assigned is null
      if (currentLocationId == null) {
        return false;
      }

      return !userAssignedLocations.find(
        (userLocation: UserLocation) =>
          userLocation.location.id === currentLocationId,
      );
    },
  },
  savingFailed: {
    message: 'Saving user locations failed.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
