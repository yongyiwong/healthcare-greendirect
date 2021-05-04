import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FormContact } from '../entities/form-contact.entity';
import { MailerNotification } from '../notification/notification.service';
import { ConfigService } from '@sierralabs/nest-utils';
import { ContactReasonDescription } from './contact-reason.enum';

@Injectable()
export class FormContactService {
  constructor(
    @InjectRepository(FormContact)
    protected readonly formContactRepository: Repository<FormContact>,
    protected readonly configService: ConfigService,
  ) {}

  public async getFormContacts(
    search?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
    includeDeleted?: boolean,
  ): Promise<[FormContact[], number]> {
    const filter = '%' + (search || '') + '%';
    const offset = page * limit;

    const query = await this.formContactRepository
      .createQueryBuilder('form_contact')
      .select()
      .leftJoin('form_contact.state', 'state')
      .leftJoin('form_contact.user', 'user')
      .groupBy('form_contact.id');

    /** Filters */
    if (search) {
      query.andWhere(
        `form_contact.deleted = false AND
        (full_name ILIKE :filter OR
        first_name ILIKE :filter OR
        last_name ILIKE :filter)`,
        {
          filter,
        },
      );
    }

    if (!includeDeleted) {
      query.andWhere('form_contact.deleted = false');
    }

    query.limit(limit).offset(offset);

    if (order) {
      const key = Object.keys(order)[0];
      order['form_contact.' + key] = order[key];
      delete order[key];
      query.orderBy(order);
    } else {
      query.orderBy('form_contact_id', 'DESC');
    }

    return query.getManyAndCount();
  }

  public async create(formContact: FormContact): Promise<FormContact> {
    delete formContact.id;
    return this.formContactRepository.save(formContact);
  }

  public composeFormContactEmail(
    contact: FormContact,
    locale: string = 'en-US',
  ): MailerNotification {
    const fromAddress = this.configService.get('email.from'); // official notif email address
    const toAddress = this.configService.get('email.contactUs'); // official support email address
    const localedEmailSubject = {
      'en-US': 'GreenDirect Support: Contact Us Form Submission ',
      'es-PR': 'Soporte GreenDirect: Contáctenos Formulario de envío ',
    };

    const email: MailerNotification = {
      subject: localedEmailSubject[locale],
      from: fromAddress,
      to: `GreenDirect Support <${toAddress}>`,
      template: 'form-contact',
      context: {
        contact,
        reason: ContactReasonDescription[contact.reason].name,
      },
    };
    return email;
  }
  public async findContactById(contactId: number): Promise<FormContact> {
    try {
      return this.formContactRepository
        .createQueryBuilder('form_contact')
        .leftJoinAndSelect('form_contact.state', 'state')
        .leftJoinAndSelect('form_contact.user', 'user')
        .where('form_contact.id = :id', { id: contactId })
        .andWhere('form_contact.deleted = false')
        .getOne();
    } catch (error) {
      throw error;
    }
  }
}
