import { TestingModule, Test } from '@nestjs/testing';
import { FormBusinessListingService } from './form-business-listing.service';
import { FormBusinessListingController } from './form-business-listing.controller';
import { AppModule } from '../app.module';
import { FormBusinessListing } from '../entities/form-business-listing.entity';
import { BusinessType } from './business-type.enum';

describe('FormBusinessListingController', () => {
  let module: TestingModule;
  let formBusinessListingService: FormBusinessListingService;
  let formBusinessListingController: FormBusinessListingController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    formBusinessListingController = module.get<FormBusinessListingController>(
      FormBusinessListingController,
    );
    formBusinessListingService = module.get<FormBusinessListingService>(
      FormBusinessListingService,
    );
  });

  it('form business listing controller should be defined', () => {
    const controller: FormBusinessListingController = module.get<
      FormBusinessListingController
    >(FormBusinessListingController);
    expect(controller).toBeDefined();
  });

  describe('Form Business Listing Unit Tests', () => {
    beforeAll(async () => {});

    it('should create new business listing', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new FormBusinessListing(),
        ...{
          fullName: `FormBusinessListing${ts} Testbot`,
          phoneNumber: `${ts}`,
          email: `gd_client+${ts}@isbx.com`,
          businessType: BusinessType.DOCTOR,
          businessName: `test doctor ${ts}`,
          addressLine1: `${ts} Ave`,
          city: 'Los Angeles',
          stateId: 5,
          website: 'www.site.com',
          postalCode: '90027',
        },
      };
      const created = await formBusinessListingService.create(info);
      expect(created.id).toBeTruthy();
    });

    it('should create a different type business listing', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new FormBusinessListing(),
        ...{
          fullName: `FormBusinessListing${ts} Brand`,
          phoneNumber: `${ts}`,
          email: `isbxmail+gd_client+${ts}@gmail.com`,
          businessType: BusinessType.BRAND,
          businessName: `test doctor ${ts}`,
          addressLine1: `${ts} Ave`,
          city: `Los Angeles ${ts}`,
          stateId: 5,
          website: 'www.google.com',
          postalCode: '90027',
        },
      };
      const created = await formBusinessListingService.create(info);
      expect(created.id).toBeTruthy();
    });
  });
});
