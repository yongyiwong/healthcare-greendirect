import { TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import * as _ from 'lodash';

import { MOCK_USER_DATA } from './user.mock';
import { LocationService } from '../../src/location';
import { MobileCheckInDto } from '../../src/mobile-check-in/mobile-check-in.dto';
import { GDExpectedException } from '../../src/gd-expected.exception';
import { LocationSearchDto } from '../../src/location/dto/location-search.dto';
import { LocationExceptions } from '../../src/location/location.exceptions';
import { MobileCheckInService } from '../../src/mobile-check-in/mobile-check-in.service';

/**
 * Mobile Check In are for CV locations only
 * POS ID: 1042
 */
export class MobileCheckinMock {
  readonly searchTerm = 'CVS'; // clinica verde mock
  private locationService: LocationService;
  private mobileCheckinService: MobileCheckInService;

  constructor(private readonly module: TestingModule) {
    this.locationService = module.get<LocationService>(LocationService);
    this.mobileCheckinService = module.get<MobileCheckInService>(
      MobileCheckInService,
    );
  }

  async generate() {
    const cvLocations = await this.locationService.findWithFilter({
      search: this.searchTerm,
    });
    if (cvLocations[1]) {
      await this.checkinMockPatient(_.first(cvLocations[0]));
    } else {
      GDExpectedException.throw(LocationExceptions.locationNotFound);
    }
  }

  async checkinMockPatient(location: LocationSearchDto) {
    const user = MOCK_USER_DATA[1]; // user_e2e
    const checkin: MobileCheckInDto = {
      locationId: location.id,
      mobileNumber: user.mobileNumber,
    };
    try {
      // Just mock the claimReward to avoid MJF calls
      jest
        .spyOn(this.mobileCheckinService, 'claimReward')
        .mockResolvedValueOnce(Promise.resolve(true));
      await this.locationService.checkIn(checkin);
    } catch (error) {
      // just ignore if already checked in
      if (HttpStatus.CONFLICT === (error as GDExpectedException).httpStatus) {
        return;
      }
      // something else happened
      throw error;
    }
  }
}
