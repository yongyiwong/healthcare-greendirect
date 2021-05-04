import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../app.module';
import { MobileCheckIn } from '../entities/mobile-check-in.entity';
import { Location } from '../entities/location.entity';
import { LocationExceptions } from '../location/location.exceptions';
import { LocationService } from '../location/location.service';
import { MobileCheckInService } from './mobile-check-in.service';
import { OrganizationService } from '../organization/organization.service';

describe('MobileCheckIn Controller', () => {
  let mobileCheckInService: MobileCheckInService;
  let organizationService: OrganizationService;
  let locationService: LocationService;
  let mockLocation: Location;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    mobileCheckInService = module.get<MobileCheckInService>(
      MobileCheckInService,
    );
    organizationService = module.get<OrganizationService>(OrganizationService);
    locationService = module.get<LocationService>(LocationService);

    // dependent on mocks
    mockLocation = (
      await locationService.findWithFilter({
        search: 'ISBX',
        limit: 1,
      })
    )[0][0] as Location;
  });

  it('should be defined', () => {
    expect(mobileCheckInService).toBeDefined();
    expect(organizationService).toBeDefined();
    expect(locationService).toBeDefined();
  });

  describe('Mobile Check In Unit Tests', () => {
    it('should add mobile check-in', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-234-567-9999',
      };

      const newMobileCheckIn: MobileCheckIn = await mobileCheckInService.create(
        mock,
      );

      expect(newMobileCheckIn.mobileNumber).toBe(mock.mobileNumber);
      expect(newMobileCheckIn.location.id).toBe(mock.location.id);
    });

    it('should update mobile check-in data', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-234-567-9999',
      };

      const newMobileCheckIn: MobileCheckIn = await mobileCheckInService.create(
        mock,
      );

      const updatedMobileCheckIn: MobileCheckIn = {
        ...newMobileCheckIn,
        mobileNumber: '+1-111-111-1111',
      };

      const mobileCheckIn: MobileCheckIn = await mobileCheckInService.update(
        updatedMobileCheckIn,
      );

      expect(mobileCheckIn.mobileNumber).toBe(
        updatedMobileCheckIn.mobileNumber,
      );
      expect(mobileCheckIn.mobileNumber).not.toBe(mock.mobileNumber);
      expect(mobileCheckIn.id).toBe(updatedMobileCheckIn.id);
    });

    it('should delete mobile check-in data', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-234-567-9999',
      };

      const newMobileCheckIn: MobileCheckIn = await mobileCheckInService.create(
        mock,
      );

      await mobileCheckInService.delete(newMobileCheckIn.id);
      const deletedMobileCheckIn: MobileCheckIn = await mobileCheckInService.findById(
        newMobileCheckIn.id,
      );

      expect(deletedMobileCheckIn).toBeFalsy();
    });

    it('should find one mobile check-in data by id', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-234-567-9999',
      };

      const newMobileCheckIn: MobileCheckIn = await mobileCheckInService.create(
        mock,
      );

      const mobileCheckIn: MobileCheckIn = await mobileCheckInService.findById(
        newMobileCheckIn.id,
      );

      expect(mobileCheckIn.mobileNumber).toBe(newMobileCheckIn.mobileNumber);
      expect(mobileCheckIn.id).toBe(newMobileCheckIn.id);
    });

    it('should get all mobile check-in data', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-234-567-9999',
      };

      await mobileCheckInService.create(mock);
      const mobileCheckIns: MobileCheckIn[] = (
        await mobileCheckInService.findWithFilter()
      )[0];
      expect(mobileCheckIns.length).toBeGreaterThan(0);
    });

    it('should get all mobile check-in data by mobile number', async () => {
      const mobileNumber = '+1-222-333-4444';
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-222-333-4444',
      };

      await mobileCheckInService.create(mock);
      const mobileCheckIns: MobileCheckIn[] = (
        await mobileCheckInService.findWithFilter(null, mobileNumber)
      )[0];
      expect(mobileCheckIns).toBeInstanceOf(Array);
      expect(mobileCheckIns[0].mobileNumber).toBe(mobileNumber);
    });

    it('should get all mobile check-in data by location id', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-222-333-4444',
      };

      await mobileCheckInService.create(mock);
      const mobileCheckIns: MobileCheckIn[] = (
        await mobileCheckInService.findWithFilter(mock.location.id)
      )[0];
      expect(mobileCheckIns[0].location.id).toBe(mock.location.id);
    });

    it('should get latest mobile check-in Record', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-222-333-4444',
      };
      await mobileCheckInService.create(mock);

      const secondMock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-222-333-4444',
      };
      const secondRecord = await mobileCheckInService.create(secondMock);

      const mobileNumber = '+1-222-333-4444';
      const latestMobileCheckIn: MobileCheckIn = await mobileCheckInService.getLatestCheckIn(
        mobileNumber,
      );

      expect(latestMobileCheckIn.id).toBe(secondRecord.id);
      expect(latestMobileCheckIn.mobileNumber).toBe(mock.mobileNumber);
    });

    it('should upsert mobile check-in Record', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-222-333-4444',
      };
      const mobileCheckIn = await mobileCheckInService.upsert(mock);
      const secondMobileCheckIn = await mobileCheckInService.upsert(mock);

      expect(mobileCheckIn.modified).not.toBe(secondMobileCheckIn.modified);
      expect(mobileCheckIn.id).toBe(secondMobileCheckIn.id);
      expect(mobileCheckIn.mobileNumber).toBe(secondMobileCheckIn.mobileNumber);
    });
  });

  describe('Expected Exceptions', () => {
    it('should not allow to get one mobile check-in record when mobile number is not provided', async () => {
      const mock: MobileCheckIn = {
        ...new MobileCheckIn(),
        location: mockLocation,
        mobileNumber: '+1-222-333-4444',
      };
      const mobileNumber = null;
      await mobileCheckInService.create(mock);

      const { mobileNumberRequired: EXPECTED } = LocationExceptions;

      expect.assertions(2); // assures that assertions get called in an async method
      try {
        await mobileCheckInService.getLatestCheckIn(mobileNumber);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });
  });
});
