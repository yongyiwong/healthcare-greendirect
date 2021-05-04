import { Test, TestingModule } from '@nestjs/testing';
import { FormContactController } from './form-contact.controller';
import { AppModule } from '../app.module';
import { FormContact } from '../entities/form-contact.entity';
import { FormContactService } from './form-contact.service';
import { ContactReason } from './contact-reason.enum';

describe('FormContactController', () => {
  let module: TestingModule;
  let formContactService: FormContactService;
  let formContactController: FormContactController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    formContactController = module.get<FormContactController>(
      FormContactController,
    );
    formContactService = module.get<FormContactService>(FormContactService);
  });

  it('should be defined', () => {
    const controller: FormContactController = module.get<FormContactController>(
      FormContactController,
    );
    expect(controller).toBeDefined();
  });

  describe('Form Contact Unit Tests', () => {
    beforeAll(async () => {});

    it('should create', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new FormContact(),
        ...{
          fullName: `Contact${ts} Testbot`,
          phoneNumber: `${ts}`,
          email: `gd_client+${ts}@isbx.com`,
          reason: ContactReason.MARKETING,
          message:
            'Helllllllloooooooooooooooooooooo........\n\n\nThis is a message.',
        },
      };
      const created = await formContactService.create(info);
      expect(created.id).toBeTruthy();
    });

    it('should create another type', async () => {
      const ts = +new Date(); // force milliseconds
      const info = {
        ...new FormContact(),
        ...{
          fullName: `Contact${ts} Person`,
          phoneNumber: `${ts}`,
          email: `isbxmail+gd_client_${ts}@gmail.com`,
          reason: ContactReason.MOD_DEPT,
          message: 'Warning, this is a message.',
        },
      };
      const created = await formContactService.create(info);
      expect(created.id).toBeTruthy();
    });

    it('should search by name of contact', async () => {
      const results = await formContactController.search('Contact');
      expect(results).toBeInstanceOf(Array);
      expect(results[0]).toBeInstanceOf(Array);
      expect(results[0].length).toBeGreaterThan(0);
    });

    it('should get list without deleted', async () => {
      const results = await formContactController.search(
        'Contact',
        null,
        null,
        null,
      );
      expect(results).toBeInstanceOf(Array);
      expect(results[0]).toBeInstanceOf(Array);
      expect(results[0]).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ deleted: true })]),
      );
    });
  });
});
