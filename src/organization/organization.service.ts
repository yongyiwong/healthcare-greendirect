import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { defaults } from 'lodash';
import Stripe from 'stripe';

import { BillingService } from '../billing/billing.service';
import { BillingExceptions } from '../billing/billing.exceptions';
import { Organization } from '../entities/organization.entity';
import { FreewayUser } from '../entities/freeway-user.entity';
import { BiotrackUser } from '../entities/biotrack-user.entity';
import { Invoice } from '../entities/invoice.entity';
import { UserLocation } from '../entities/user-location.entity';
import { Location } from '../entities/location.entity';
import { GDExpectedException } from '../gd-expected.exception';
import {
  SearchParams,
  DEFAULT_PARAMS,
} from '../common/search-params.interface';
import { OrganizationDto } from './organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    protected readonly organizationRepository: Repository<Organization>,
    protected readonly billingService: BillingService,
  ) {}

  public async findWithFilter(
    searchParams: SearchParams = {},
  ): Promise<[Organization[], number]> {
    searchParams = defaults(searchParams, DEFAULT_PARAMS);
    const { search, page, limit, order, includeLocations } = searchParams;

    const tableName = 'organization';
    const filter = '%' + (search || '') + '%';
    const offset = page * limit;
    const query = this.organizationRepository
      .createQueryBuilder(tableName)
      .leftJoinAndSelect('organization.state', 'state')
      .where(
        `${tableName}.name ILIKE :filter OR
        ${tableName}.city ILIKE :filter OR
        ${tableName}.addressLine1 ILIKE :filter OR
        ${tableName}.addressLine2 ILIKE :filter`,
        { filter },
      );

    // optional, server-use only
    // instead use /GET locations with organizationId for front-end use
    if (includeLocations) {
      query.leftJoinAndSelect(`${tableName}.locations`, 'locations');
    }
    const count = await query.getCount();

    query.limit(limit).offset(offset);
    if (order) {
      const key = Object.keys(order)[0];
      order[`${tableName}.${key}`] = order[key];
      delete order[key];
      query.orderBy(order);
    } else {
      query.orderBy(`${tableName}.name`, 'ASC');
    }

    const rawMany = await query.getMany();
    return [rawMany, count];
  }

  public async findWithActiveDealsCount(
    searchParams: SearchParams = {},
  ): Promise<[OrganizationDto[], number]> {
    searchParams = defaults(searchParams, DEFAULT_PARAMS);
    const { search, page, limit, order, organizationId } = searchParams;

    const tableName = 'organization';
    const offset = page * limit;
    const query = this.organizationRepository
      .createQueryBuilder(tableName)
      .select([
        `${tableName}.id as id`,
        `${tableName}.name as name`,
        `${tableName}.maxActiveDeals as "maxActiveDeals"`,
      ]);

    const activeDealQuery = subQuery =>
      subQuery
        .select(['location.organization_id as "organizationId"'])
        .from(Location, 'location')
        .innerJoin(
          'location.deals',
          'locationDeal',
          'locationDeal.deleted = false',
        )
        .innerJoin('locationDeal.deal', 'deal', 'deal.deleted = false')
        .andWhere(
          `CASE
            WHEN deal.endDate IS NOT NULL
            THEN timezone(deal.timezone, current_timestamp) ::DATE <= deal.endDate ::DATE
            ELSE true
          END`,
        )
        .andWhere('location.deleted = false')
        .groupBy('location.organization_id, deal.id');
    query
      .addSelect(['COUNT("activeDeal"."organizationId") as "activeDealsCount"'])
      .leftJoin(
        activeDealQuery,
        'activeDeal',
        'organization.id = "activeDeal"."organizationId"',
      )
      .groupBy('organization.id, "activeDeal"."organizationId"');

    if (search) {
      const filter = '%' + search + '%';
      query.andWhere(`${tableName}.name ILIKE :filter`, {
        filter,
      });
    }
    if (organizationId) {
      query.andWhere('organization.id = :organizationId', { organizationId });
    }
    const count = await query.getCount();
    query.limit(limit).offset(offset);

    if (order) {
      const [column, value = 'ASC'] = order.split(' ');
      const orderValue = value.toUpperCase() as 'ASC' | 'DESC';

      if (column === 'activeDealsCount') {
        query.orderBy(`"activeDealsCount"`, orderValue);
      } else {
        query.orderBy(`${tableName}.${column}`, orderValue);
      }
    } else {
      query.orderBy(`${tableName}.name`, 'ASC');
    }

    const rawMany = await query.getRawMany();
    return [rawMany, count];
  }

  public async findById(id: number): Promise<OrganizationDto> {
    if (!id) throw new BadRequestException('id not provided');
    const result = await this.organizationRepository.findOne(id);
    const organization = result as OrganizationDto;

    if (organization) {
      const activeDealsCount = await this.findWithActiveDealsCount({
        organizationId: id,
      });
      organization.activeDealsCount = activeDealsCount[0][0].activeDealsCount;
    }
    return organization;
  }

  public async findByPosId(posId: number): Promise<Organization> {
    try {
      const query = this.organizationRepository
        .createQueryBuilder('organization')
        .where('organization.posId = :posId', { posId });
      return query.getOne();
    } catch (error) {
      throw error;
    }
  }

  public async getFreewayBiotrackUserOrganizations(
    email: string,
  ): Promise<Organization[]> {
    try {
      const query = this.organizationRepository
        .createQueryBuilder('organization')
        .leftJoin(
          FreewayUser,
          'freewayUser',
          'organization.posId = freewayUser.orgId',
        )
        .leftJoin(
          BiotrackUser,
          'biotrackUser',
          'organization.posId = biotrackUser.posOrgId',
        )
        .andWhere(
          'freewayUser.email = :freewayEmail OR biotrackUser.email = :biotrackEmail',
          { freewayEmail: email, biotrackEmail: email },
        );
      return query.getMany();
    } catch (error) {
      throw error;
    }
  }

  public async create(organization: Organization): Promise<Organization> {
    delete organization.id;
    return this.organizationRepository.save(organization);
  }

  public async update(organization: Organization): Promise<Organization> {
    delete organization.createdBy;
    return this.organizationRepository.save(organization);
  }

  public async remove(id: number, modifiedBy: number): Promise<UpdateResult> {
    return this.organizationRepository.update(
      { id },
      { deleted: true, modifiedBy },
    );
  }

  public async findByAssignedUserId(userId: number): Promise<Organization> {
    try {
      const query = this.organizationRepository
        .createQueryBuilder('organization')
        .addSelect('state.country')
        .leftJoinAndSelect('organization.state', 'state')
        .innerJoin('organization.locations', 'location')
        .innerJoin(
          UserLocation,
          'assignments',
          'location.id = assignments.location',
        )
        .innerJoin('assignments.user', 'user')
        .andWhere('assignments.deleted = false')
        .andWhere('user.id = :userId', { userId });

      return query.getOne();
    } catch (error) {
      throw error;
    }
  }

  public async saveBillingCard(
    organization: Organization,
    userId: number,
    email: string,
    cardTokenId: string,
  ): Promise<boolean> {
    try {
      const customerId = organization.stripeCustomerId;
      const customerCardDetail = await this.billingService.setupCustomerCardDetail(
        cardTokenId,
      );
      const customerDetail = {
        ...customerCardDetail,
        description: organization.description,
        phone: organization.contactPhone,
        email,
        source: cardTokenId,
      };

      const organizationUpdate = {
        id: organization.id,
        stripeReceiptEmail: email,
        modifiedBy: userId,
      } as Organization;

      if (customerId) {
        const customer = await this.billingService.getCustomer(customerId);
        if (customer && !customer.deleted) {
          return this.updateBillingCard(
            customerId,
            customerDetail,
            organizationUpdate,
          );
        }
      }
      return this.createBillingCard(customerDetail, organizationUpdate);
    } catch (error) {
      throw error;
    }
  }

  public async createBillingCard(
    customerDetail: Stripe.CustomerCreateParams,
    organizationUpdate: Organization,
  ): Promise<boolean> {
    try {
      const customer = await this.billingService.createCustomer(customerDetail);
      GDExpectedException.try(BillingExceptions.createCardFailed, customer);

      organizationUpdate.stripeCustomerId = customer.id;
      const updatedOrganization = await this.update(organizationUpdate);
      GDExpectedException.try(
        BillingExceptions.saveCardReferenceFailed,
        updatedOrganization,
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  public async updateBillingCard(
    customerId: string,
    customerDetail: Stripe.CustomerUpdateParams,
    organizationUpdate: Organization,
  ): Promise<boolean> {
    try {
      const customer = this.billingService.updateCustomer(
        customerId,
        customerDetail,
      );
      GDExpectedException.try(BillingExceptions.updateCardFailed, customer);

      const updatedOrganization = await this.update(organizationUpdate);
      GDExpectedException.try(
        BillingExceptions.saveCardReferenceFailed,
        updatedOrganization,
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  public async retrieveBillingCard(
    organization: Organization,
  ): Promise<Stripe.CustomerSource> {
    try {
      if (!organization.stripeCustomerId) return;
      const customerId = organization.stripeCustomerId;
      return this.billingService.retrieveCard(customerId);
    } catch (error) {
      throw error;
    }
  }

  public async deleteBillingCard(
    organization: Organization,
    userId: number,
  ): Promise<boolean> {
    try {
      GDExpectedException.try(
        BillingExceptions.noCustomerId,
        organization.stripeCustomerId,
      );

      const customerId = organization.stripeCustomerId;
      const organizationUpdate = {
        id: organization.id,
        stripeReceiptEmail: null,
        modifiedBy: userId,
      } as Organization;

      await Promise.all([
        this.update(organizationUpdate),
        this.billingService.deleteCard(customerId),
      ]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  public async getBillingInvoiceList(
    userId?: number,
    organizationId?: number,
    page: number = 0,
    limit: number = 100,
    order?: string,
  ): Promise<[Invoice[], number]> {
    try {
      if (userId) {
        const organization = await this.findByAssignedUserId(userId);
        if (!organization) return [[], 0];
        organizationId = organization.id;
      }

      return this.billingService.getInvoiceList(
        organizationId,
        page,
        limit,
        order,
      );
    } catch (error) {
      throw error;
    }
  }

  public async getBillingInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      return this.billingService.getExternalInvoice(invoiceId);
    } catch (error) {
      throw error;
    }
  }
}
