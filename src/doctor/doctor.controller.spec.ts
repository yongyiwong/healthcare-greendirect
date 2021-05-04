import { DoctorController } from './doctor.controller';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import * as _ from 'lodash';
import { DoctorExceptions } from './doctor.exceptions';

describe('DoctorController', () => {
  let doctorController: DoctorController;
  // Doctor 5313 location coords in PR
  const userLocation = { lat: 18.380158, lng: -67.1887 };
  // default bounds centering in "doctor location": id 5313
  const mapBounds = {
    maxLat: 18.3755,
    maxLong: -67.1944,
    minLat: 18.3848,
    minLong: -67.183,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    doctorController = module.get<DoctorController>(DoctorController);
  });

  describe('Doctor Unit Tests', () => {
    it('should search by text', async () => {
      const results = await doctorController.search('CARLOS');
      expect(results).toBeInstanceOf(Array);
      expect(results[0]).toBeInstanceOf(Array);
      expect(results[0].length).toBeGreaterThan(0);
    });

    it('should search by lat/long', async () => {
      const results = await doctorController.search(
        '',
        18.3952,
        -67.1737,
        18.3764,
        -67.1966,
      );
      expect(results).toBeInstanceOf(Array);
      expect(results[0]).toBeInstanceOf(Array);
      expect(results[0].length).toBe(5);
    });

    it('should not sort nearest to user location if none provided', async () => {
      // Expected - Nearest order based on coordinates
      const orderedNearest = [
        'JORGE SO',
        'CARLOS R.',
        'NELSON E.',
        'ROBERTO H.',
        'YOLANDA VA',
      ]; // dependent on doctor seed data.
      const limit = orderedNearest.length;

      const results = await doctorController.search(
        '',
        mapBounds.minLat,
        mapBounds.minLong,
        mapBounds.maxLat,
        mapBounds.maxLong,
        null,
        limit,
        null,
        null,
      );
      expect(results[1]).toBe(limit); // has results

      const actualOrder = results[0];

      // at least one item should not match the order
      let mismatched = false;
      for (let i = 0; i < actualOrder.length; i++) {
        const expectedNameWhenOrderedNearest = orderedNearest[i];
        if (
          actualOrder[i].name.substr(
            0,
            expectedNameWhenOrderedNearest.length,
          ) !== expectedNameWhenOrderedNearest
        ) {
          mismatched = true;
        }
      }
      expect(mismatched).toBeTruthy();
    });

    it('should sort nearest to user location if provided', async () => {
      // Expected - Nearest order based on coordinates
      const expectedOrder = [
        'JORGE SO',
        'CARLOS R.',
        'NELSON E.',
        'ROBERTO H.',
        'YOLANDA VA',
      ]; // dependent on doctor seed data.
      const limit = expectedOrder.length;
      const results = await doctorController.search(
        '',
        mapBounds.minLat,
        mapBounds.minLong,
        mapBounds.maxLat,
        mapBounds.maxLong,
        null,
        limit,
        null,
        userLocation.lat,
        userLocation.lng,
      );
      expect(results[1]).toBe(limit); // has results

      const actualOrder = results[0];
      // match the order
      for (let i = 0; i < actualOrder.length; i++) {
        const expectedName = expectedOrder[i];
        expect(actualOrder[i].name.substr(0, expectedName.length)).toBe(
          expectedName,
        );
      }
    });

    it('should sort by priority', async () => {
      const results = await doctorController.search(
        '',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        userLocation.lat,
        userLocation.lng,
      );

      const firstDoctor = results[0][0];
      expect(firstDoctor.priority).toBe(1);
    });
  });

  // TODO add suite for supertest tests (http requests level test)

  describe('Expected Exceptions', () => {
    it('should not allow starting lat missing', async () => {
      const { invalidStartingLatLong: EXPECTED } = DoctorExceptions;
      expect.assertions(2); // assures that assertions get called in an async method
      try {
        await doctorController.search(
          '',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          userLocation.lng,
        ); // failed to provide starting location latitude
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });

    it('should not allow starting lng missing', async () => {
      const { invalidStartingLatLong: EXPECTED } = DoctorExceptions;
      expect.assertions(2); // assures that assertions get called in an async method
      try {
        await doctorController.search(
          '',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          userLocation.lat,
          null, // failed to provide starting location longitude
        );
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });
  });
});
