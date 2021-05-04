import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@sierralabs/nest-utils';

import { FormBusinessListing } from '../entities/form-business-listing.entity';
import { MailerNotification } from '../notification/notification.service';
import { BusinessTypeDescription } from './business-type.enum';

@Injectable()
export class FormBusinessListingService {
  constructor(
    @InjectRepository(FormBusinessListing)
    protected readonly formBusinessListingRepository: Repository<
      FormBusinessListing
    >,
    protected readonly configService: ConfigService,
  ) {}

  public async create(
    formBusinessListing: FormBusinessListing,
  ): Promise<FormBusinessListing> {
    delete formBusinessListing.id;
    return this.formBusinessListingRepository.save(formBusinessListing);
  }

  public composeFormBusinessListingEmail(
    formBusinessListing: FormBusinessListing,
    locale: string = 'en-US',
  ): MailerNotification {
    const fromAddress = this.configService.get('email.from'); // official notif email address
    const toAddress = this.configService.get('email.contactUs'); // official support email address
    const localedEmailSubject = {
      'en-US': 'GreenDirect Support: New Business Listing Submission ',
      'es-PR': 'Soporte GreenDirect: Nueva Lista de Negocios de envío ',
    };

    const email: MailerNotification = {
      subject: localedEmailSubject[locale],
      from: fromAddress,
      to: `GreenDirect Support <${toAddress}>`,
      template: 'business-listing',
      context: {
        formBusinessListing,
        businessType:
          BusinessTypeDescription[formBusinessListing.businessType].name,
      },
    };
    return email;
  }

  public async getFormBusinessListings(
    search?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
    includeDeleted?: boolean,
  ): Promise<[FormBusinessListing[], number]> {
    try {
      const filter = '%' + (search || '') + '%';
      const offset = page * limit;

      const query = this.formBusinessListingRepository
        .createQueryBuilder('form_business_listing')
        .select()
        .leftJoin('form_business_listing.state', 'state')
        .leftJoin('form_business_listing.user', 'user');

      /** Filters */
      if (search) {
        query.andWhere(
          `form_business_listing.deleted = false AND
          (full_name ILIKE :filter OR
          first_name ILIKE :filter OR
          last_name ILIKE :filter OR
          form_business_listing.business_name ILIKE :filter)`,
          {
            filter,
          },
        );
      }

      if (!includeDeleted) {
        query.andWhere('form_business_listing.deleted = false');
      }

      query.limit(limit).offset(offset);

      if (order) {
        const key = Object.keys(order)[0];
        order['form_business_listing.' + key] = order[key];
        delete order[key];
        query.orderBy(order);
      } else {
        query.orderBy('form_business_listing_id', 'DESC');
      }

      return query.getManyAndCount();
    } catch (error) {
      throw error;
    }
  }

  public async findBusinessById(
    businessId: number,
  ): Promise<FormBusinessListing> {
    try {
      return this.formBusinessListingRepository
        .createQueryBuilder('form_business_listing')
        .leftJoinAndSelect('form_business_listing.state', 'state')
        .leftJoinAndSelect('form_business_listing.user', 'user')
        .where('form_business_listing.id = :id', { id: businessId })
        .andWhere('form_business_listing.deleted = false')
        .getOne();
    } catch (error) {
      throw error;
    }
  }
}
