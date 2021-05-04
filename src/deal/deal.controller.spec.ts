import * as Fixtures from '../../test/fixtures';
import { def, get } from 'bdd-lazy-var';
import faker from 'faker';

import { Test, TestingModule } from '@nestjs/testing';
import { DealController } from './deal.controller';
import { AppModule } from '../app.module';
import { DealService } from './deal.service';
import { TestUtilsModule } from '../../test/utils/test-utils.module';
import { FixtureService } from '../../test/utils/fixture.service';
import { Deal } from '../entities/deal.entity';
import { Location } from '../entities/location.entity';
import { Organization } from '../entities/organization.entity';
import { LocationDeal } from '../entities/location-deal.entity';
import { DealDay } from '../entities/deal-day.entity';
import * as _ from 'lodash';
import { addDays } from 'date-fns';
import { LocationService } from '../location';
import { DealExceptions } from './deal.exceptions';
import { GDExpectedException } from '../gd-expected.exception';

describe('DealController', () => {
  let module: TestingModule;
  let fixtureService: FixtureService;
  let dealController: DealController;
  let dealService: DealService;
  let locationService: LocationService;

  const TEST_DATE = new Date();
  const LOCATION = 'location';
  const ORGANIZATION = 'organization';
  const DEAL = 'deal';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule, TestUtilsModule],
    }).compile();
    fixtureService = module.get<FixtureService>(FixtureService);
    dealService = module.get<DealService>(DealService);
    dealController = module.get<DealController>(DealController);
    locationService = module.get<LocationService>(LocationService);
  });

  // These definitions insert new records with random values.
  def(ORGANIZATION, async () =>
    fixtureService.saveEntityUsingValues(Organization),
  );
  def(LOCATION, async () => {
    const location = await fixtureService.saveEntityUsingValues(Location, {
      organization: await get(ORGANIZATION), // prepare one org only
      products: [new Fixtures.ProductFixture()],
    });
    return location;
  });
  def(DEAL, async () => {
    const location = await get(LOCATION);
    const deal = await fixtureService.saveEntityUsingValues(Deal, {
      startDate: new Date(Date.now() - ( 3600 * 1000 * 24)),
      endDate:new Date(Date.now() + ( 3600 * 1000 * 24 * 2)), 
      dealLocations: [{ location } as LocationDeal],
      dealDays: [
        { dayOfWeek: 0, isActive: false },
        { dayOfWeek: 1, isActive: true },
        { dayOfWeek: 2, isActive: true },
        { dayOfWeek: 3, isActive: true },
        { dayOfWeek: 4, isActive: false },
        { dayOfWeek: 5, isActive: true },
        { dayOfWeek: 6, isActive: false },
      ] as DealDay[],
    });
    return deal;
  });

  it('should be defined', () => {
    expect(dealService).toBeDefined();
    expect(dealController).toBeDefined();
  });

  describe('Deal_Spec', async () => {
    it('should create a deal', async () => {
      const location = await get(LOCATION);
      const locationDeal = { location } as LocationDeal;

      const data = new Deal();
      data.title = `CREATE-${faker.commerce.productName()} ${TEST_DATE.getTime()} DEAL`;
      data.dealLocations = [locationDeal];
      data.dealDays = [
        { dayOfWeek: 0, isActive: true },
        { dayOfWeek: 1, isActive: true },
        { dayOfWeek: 2, isActive: false },
        { dayOfWeek: 3, isActive: true },
        { dayOfWeek: 4, isActive: true },
        { dayOfWeek: 5, isActive: false },
        { dayOfWeek: 6, isActive: true },
      ] as DealDay[];

      const deal = await dealService.createDeal(data);
      expect(deal).toBeTruthy();
      expect(deal);
    });

    it('should get deals', async () => {
      const deal = await dealService.findWithFilter({
        includeUnassigned: true,
        includeInactiveDeals: true,
      });
      expect(deal).toBeTruthy();
      expect(deal[0].length).toBeGreaterThan(0);
    });

    it('should get days available for deals', async () => {
      const deals = await dealService.findWithFilter();
      expect(deals[0].length).toBeGreaterThan(0);
      expect(deals[0][0].dealDays.length).toBeGreaterThan(0);
    });

    it('should get days available for the day', async () => {
      const deals = await dealService.findWithFilter();
      expect(deals[0].length).toBeGreaterThan(0);
      expect(deals[0][0].dealDays.length).toBeGreaterThan(0);
      expect(
        _.filter(deals[0], deal => {
          return (
            _.find(deal.dealDays, {
              isActive: true,
              dayOfWeek: new Date().getDay(),
            }) || deal.dealDays.length === 0
          );
        }).length,
      ).toBe(deals[0].length);
    });

    it('should search existing deal by name', async () => {
      const dealName = faker.commerce.productName();

      const data = new Deal();
      data.title = `MOCK-${dealName} ${TEST_DATE.getTime()} DEAL`;

      const deal = await dealService.createDeal(data);
      expect(deal.id).toBeTruthy();

      const previouslyCreatedDeal = `${deal.title}`;
      const deals = await dealService.findWithFilter({
        search: dealName,
        includeDeleted: false,
        includeUnassigned: true,
        includeInactiveDeals: true,
      });
      expect(deal).toBeTruthy();
      expect(deals[1]).toBeGreaterThan(0);
    });

    it('should search existing deal by start-end dates', async () => {
      const deal = await dealService.findWithFilter({
        startDate: new Date(0).getTime(), // beginning of time
        endDate: Date.now(), // now
      });
      expect(deal[0].length).toBeGreaterThan(0);
    });

    it('should not retrieved deals unassigned to location', async () => {
      const dealName = faker.commerce.productName();

      const data = new Deal();
      data.title = `UNASSIGNED-${dealName} ${TEST_DATE.getTime()} DEAL`;
      data.dealLocations = null;

      const deal = await dealService.createDeal(data);
      expect(deal.id).toBeTruthy();

      const noDeal = await dealService.findWithFilter({
        search: data.title,
        includeDeleted: false,
        includeUnassigned: false,
        includeInactiveDeals: false,
      });
      const count = noDeal[1];
      expect(count).not.toBeGreaterThan(0);
    });

    it('should retrieve deals unassigned to location if specified', async () => {
      const dealName = faker.commerce.productName();

      const data = new Deal();
      data.title = `UNASSIGNED-${dealName} ${TEST_DATE.getTime()} DEAL`;
      data.dealLocations = null;

      const deal = await dealService.createDeal(data);
      expect(deal.id).toBeTruthy();

      const noDeal = await dealService.findWithFilter({
        search: dealName,
        includeUnassigned: true,
        includeInactiveDeals: true,
      });
      const count = noDeal[1];
      expect(count).toBeGreaterThan(0);
    });

    it('should be able to retrieve deal by id', async () => {
      const newDeal = await get(DEAL);
      const dealById = await dealService.findById(newDeal.id);
      expect(dealById).toBeTruthy();
    });

    it('should not retrieve deals if the assigned locations are deleted', async () => {
      const SHUFFLE_BASE_VALUE = 6.91;
      const newDeal = await get(DEAL);
      expect(newDeal).toBeTruthy();
      expect(newDeal.dealLocations.length).toBe(1);
      // Delete assigned location
      const assignedLocation = newDeal.dealLocations[0];
      expect(assignedLocation.location).toBeTruthy();
      await locationService.remove(assignedLocation.location.id, null);

      // WEB and APP
      const [dealsInWebApp] = await dealService.findWithFilter({
        search: newDeal.title,
        includeUnassigned: false,
        includeInactiveDeals: false,
        shuffleBaseValue: SHUFFLE_BASE_VALUE,
      });
      expect(dealsInWebApp.length).toEqual(0);

      // CMS
      const [dealWithDeletedLocation] = await dealService.findWithFilter({
        search: newDeal.title,
        startDate: 0,
        includeUnassigned: true,
        includeInactiveDeals: true,
      });
      expect(dealWithDeletedLocation.length).toEqual(1);
    });
  });

  describe('Deal_ExpectedException', () => {
    // it('should trigger not found exception', async () => {});

    it('should not claim expired deal', async () => {
      const { dealHasExpired: EXPECTED } = DealExceptions;
      const deal: Deal = await get(DEAL);
      expect(deal).toBeTruthy();
      expect(deal.dealLocations.length).toBe(1);

      // Expired date
      const EXPIRED_DAY = -2;
      deal.expirationDate = addDays(new Date(), EXPIRED_DAY);
      await dealService.updateDeal(deal);

      expect.assertions(2); // assures that assertions get called in an async method
      try {
        GDExpectedException.try(DealExceptions.dealHasExpired, deal);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }

      // Null date
      deal.expirationDate = null;
      await dealService.updateDeal(deal);

      expect.assertions(6); // assures that assertions get called in an async method
      try {
        GDExpectedException.try(DealExceptions.dealHasExpired, deal);
      } catch (error) {
        expect(error.getStatus()).toEqual(EXPECTED.httpStatus);
        expect(error.message).toEqual(EXPECTED.message);
      }
    });
  });
});
