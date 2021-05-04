import {
  Controller,
  Get,
  UsePipes,
  Query,
  ParseIntPipe,
  Param,
  Post,
  UseInterceptors,
  Body,
  Put,
  Delete,
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiImplicitQuery,
  ApiImplicitBody,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { Roles, OwnerInterceptor } from '@sierralabs/nest-identity';
import { RequiredPipe, ParseEntityPipe } from '@sierralabs/nest-utils';
import Stripe from 'stripe';
import { UpdateResult } from 'typeorm';
import { find, isNil } from 'lodash';

import { OrganizationService } from './organization.service';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { Invoice } from '../entities/invoice.entity';
import { Organization } from '../entities/organization.entity';
import { OrderService } from '../order/order.service';
import { RoleEnum } from '../roles/roles.enum';
import { UserService } from '../user';
import { LocationService } from '../location';
import { User } from '../entities/user.entity';
import { GDExpectedException } from '../gd-expected.exception';
import { OrganizationExceptions } from './organization.exceptions';
import { SearchParams } from '../common/search-params.interface';
import { OrganizationDto } from './organization.dto';

const { Admin, SiteAdmin, Employee } = RoleEnum;
@ApiBearerAuth()
@ApiUseTags('Organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => LocationService))
    private readonly locationService: LocationService,
  ) {}

  @Roles(Admin, SiteAdmin, Employee)
  @Get()
  @UsePipes(new SearchValidationPipe(Organization))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  async search(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
  ): Promise<[Organization[], number]> {
    // TODO Allow SiteAdmin and Employees to only see their own company.
    const searchParams: SearchParams = {
      search,
      page,
      limit,
      order,
    };
    return this.organizationService.findWithFilter(searchParams);
  }

  @Roles(Admin)
  @Get('active-deals-count')
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  async findWithActiveDealsCount(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
  ): Promise<[OrganizationDto[], number]> {
    const searchParams: SearchParams = {
      search,
      page,
      limit,
      order,
    };
    return this.organizationService.findWithActiveDealsCount(searchParams);
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get(':id([0-9]+)')
  async getOne(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<Organization> {
    return this.organizationService.findById(id);
  }

  @Roles(Admin)
  @Post()
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  async create(
    @Body(new RequiredPipe()) organization: Organization,
  ): Promise<Organization> {
    return this.organizationService.create(organization);
  }

  @Roles(Admin)
  @Put(':id([0-9]+)')
  @UseInterceptors(new OwnerInterceptor(['modifiedBy']))
  async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    organization: Organization,
  ): Promise<Organization> {
    const { allowOffHours, maxActiveDeals } = organization;
    if (!isNil(organization.maxActiveDeals)) {
      const { activeDealsCount } = (
        await this.organizationService.findWithActiveDealsCount({
          organizationId: id,
        })
      )[0][0];

      GDExpectedException.try(
        OrganizationExceptions.dealsLimitIsLessThanDealsCount,
        {
          maxActiveDeals,
          activeDealsCount,
        },
      );
    }

    await this.organizationService.update(organization);
    if (!isNil(allowOffHours)) {
      this.locationService.updateOffHoursByOrganizationId(id, allowOffHours);
    }

    return this.organizationService.findById(id); // updated record
  }

  @Roles(Admin)
  @Delete(':id([0-9]+)')
  async remove(@Param('id') id: number, @Req() request): Promise<UpdateResult> {
    return this.organizationService.remove(id, request.user.id);
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get(':id([0-9]+)/patients')
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  async getPatients(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
  ): Promise<[User[], number]> {
    return this.orderService.getPatients(
      null,
      organizationId,
      search,
      page,
      limit,
      order,
    );
  }

  @Roles(Admin)
  @Get(':id([0-9]+)/assignable-users')
  @ApiImplicitQuery({ name: 'role', required: false })
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  async getAssignableOrganizationUsers(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Query('role') role?: RoleEnum,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
  ): Promise<[User[], number]> {
    return this.userService.getAssignableOrganizationUsers(
      organizationId,
      role,
      search,
      page,
      limit,
      order,
    );
  }

  @Roles(Admin)
  @Get(':id([0-9]+)/assigned-users')
  @ApiImplicitQuery({ name: 'role', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  async getAssignedOrganizationUsers(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Query('role') role?: RoleEnum,
    @Query('order') order?: string,
  ): Promise<[User[], number]> {
    return this.userService.getAssignedOrganizationUsers(
      organizationId,
      role,
      order,
    );
  }

  @Roles(Admin)
  @Post(':id([0-9]+)/site-admins')
  @ApiImplicitQuery({ name: 'orgSiteAdmins', required: false })
  async manageOrganizationSiteAdmins(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Body(new RequiredPipe()) organizationSiteAdminIds: number[],
    @Req() request,
  ): Promise<void> {
    const modifiedBy = request.user.id;
    return this.locationService.manageOrganizationSiteAdmins(
      organizationId,
      organizationSiteAdminIds,
      modifiedBy,
    );
  }

  @Roles(Admin, SiteAdmin)
  @Get(':id([0-9]+)/billing/card')
  @ApiImplicitParam({ name: 'id', type: Number })
  async retrieveBillingCard(
    @Req() request,
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<Stripe.CustomerSource> {
    try {
      const organizationAssigned = await this.organizationService.findById(
        organizationId,
      );

      if (find(request.user.roles, { name: SiteAdmin })) {
        GDExpectedException.try(
          OrganizationExceptions.siteAdminNotAssignedToOrg,
          {
            organizationId,
            organizationAssigned,
          },
        );
      }

      return this.organizationService.retrieveBillingCard(organizationAssigned);
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin, SiteAdmin)
  @Post(':id([0-9]+)/billing/card')
  @ApiImplicitParam({ name: 'id', type: Number })
  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      email: string;
      cardTokenId: string;
      new() {}
    },
  })
  async saveBillingCard(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Req() request,
    @Body('email') email: string,
    @Body('cardTokenId', new RequiredPipe()) cardTokenId: string,
  ): Promise<boolean> {
    const organizationAssigned = await this.organizationService.findById(
      organizationId,
    );

    if (find(request.user.roles, { name: SiteAdmin })) {
      GDExpectedException.try(
        OrganizationExceptions.siteAdminNotAssignedToOrg,
        {
          organizationId,
          organizationAssigned,
        },
      );
    }
    return this.organizationService.saveBillingCard(
      organizationAssigned,
      request.user.id,
      email,
      cardTokenId,
    );
  }

  @Roles(Admin, SiteAdmin)
  @Delete(':id([0-9]+)/billing/card')
  @ApiImplicitParam({ name: 'id', type: Number })
  async deleteBillingCard(
    @Req() request,
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<boolean> {
    const organizationAssigned = await this.organizationService.findById(
      organizationId,
    );
    if (find(request.user.roles, { name: SiteAdmin })) {
      GDExpectedException.try(
        OrganizationExceptions.siteAdminNotAssignedToOrg,
        {
          organizationId,
          organizationAssigned,
        },
      );
    }
    return this.organizationService.deleteBillingCard(
      organizationAssigned,
      request.user.id,
    );
  }

  @Roles(Admin, SiteAdmin)
  @Get(':id([0-9]+)/billing/card/invoices')
  @UsePipes(new SearchValidationPipe(Invoice))
  @ApiImplicitParam({ name: 'id', type: Number })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  async getBillingInvoiceList(
    @Req() request,
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
  ): Promise<[Invoice[], number]> {
    let userId = request.user.id;
    if (find(request.user.roles, { name: Admin })) {
      userId = null;
    }

    return this.organizationService.getBillingInvoiceList(
      userId,
      organizationId,
      page,
      limit,
      order,
    );
  }

  @Roles(Admin, SiteAdmin)
  @Get('billing/card/invoices/:invoiceId')
  @ApiImplicitParam({ name: 'invoiceId', type: String })
  public async getBillingInvoice(
    @Param('invoiceId') invoiceId: string,
  ): Promise<Stripe.Invoice> {
    return this.organizationService.getBillingInvoice(invoiceId);
  }
}
