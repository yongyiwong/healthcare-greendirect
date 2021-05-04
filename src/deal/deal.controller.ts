import {
  Controller,
  Get,
  UsePipes,
  Query,
  Param,
  ParseIntPipe,
  Put,
  UseInterceptors,
  Body,
  Delete,
  Req,
  Post,
  Res,
  Next,
} from '@nestjs/common';
import {
  ApiImplicitBody,
  ApiBearerAuth,
  ApiUseTags,
  ApiImplicitQuery,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ParseBooleanPipe,
  RequiredPipe,
  ParseEntityPipe,
  ConfigService,
} from '@sierralabs/nest-utils';
import { UpdateResult } from 'typeorm';
import { Roles, OwnerInterceptor } from '@sierralabs/nest-identity';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import * as log from 'fancy-log';

import { Deal } from '../entities/deal.entity';
import { DealService } from './deal.service';
import { RoleEnum } from '../roles/roles.enum';
import { DealPresignDto } from './deal-presign.dto';
import {
  NotificationService,
  NotificationMethod,
} from '../notification/notification.service';
import { UserService } from '../user';
import { User } from '../entities/user.entity';
import { DealCategory } from './deal-category.enum';

const { Admin, SiteAdmin } = RoleEnum;

@ApiBearerAuth()
@ApiUseTags('Deals')
@Controller('deals')
export class DealController {
  constructor(
    private readonly dealService: DealService,
    private readonly userService: UserService,
    protected readonly configService: ConfigService,
    protected readonly notificationService: NotificationService,
  ) {}

  @Get()
  @UsePipes(new SearchValidationPipe(Deal))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'category', required: false })
  @ApiImplicitQuery({ name: 'startDate', required: false })
  @ApiImplicitQuery({ name: 'endDate', required: false })
  @ApiImplicitQuery({ name: 'locationId', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  @ApiImplicitQuery({ name: 'includeUnassigned', required: false })
  @ApiImplicitQuery({ name: 'includeInactiveDeals', required: false })
  @ApiImplicitQuery({ name: 'excludeEnded', required: false })
  @ApiImplicitQuery({ name: 'shuffleBaseValue', required: false })
  public async getDeals(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('category') category?: DealCategory,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('locationId') locationId?: number,
    @Query('includeDeleted', new ParseBooleanPipe())
    includeDeleted: boolean = false,
    @Query('includeUnassigned', new ParseBooleanPipe())
    includeUnassigned: boolean = false,
    @Query('includeInactiveDeals', new ParseBooleanPipe())
    includeInactiveDeals: boolean = false,
    @Query('excludeEnded', new ParseBooleanPipe())
    excludeEnded: boolean = false,
    @Query('shuffleBaseValue') shuffleBaseValue?: number,
  ) {
    try {
      return this.dealService.findWithFilter({
        search,
        page,
        limit,
        order,
        category,
        startDate,
        endDate,
        locationId,
        includeDeleted,
        includeUnassigned,
        includeInactiveDeals,
        excludeEnded,
        shuffleBaseValue,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get(':id([0-9]+)')
  @ApiImplicitQuery({ name: 'locationId', required: false })
  public async getOne(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('locationId') locationId?: number,
  ): Promise<Deal> {
    return this.dealService.findById(id, locationId);
  }

  @Roles(Admin, SiteAdmin)
  @Post()
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  public async create(@Body(new RequiredPipe()) deal: Deal): Promise<Deal> {
    await this.dealService.checkCreateDeal(deal);
    delete deal.dealLocations;
    return this.dealService.createDeal(deal);
  }

  @Roles(Admin, SiteAdmin)
  @Put(':id([0-9]+)')
  @UseInterceptors(new OwnerInterceptor(['modifiedBy']))
  public async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    deal: Deal,
  ): Promise<Deal> {
    deal.id = id;
    await this.dealService.checkUpdateDeal(deal);
    return this.dealService.updateDeal(deal);
  }

  @Roles(Admin, SiteAdmin)
  @Delete(':id([0-9]+)')
  public async remove(
    @Param('id') id: number,
    @Req() request,
  ): Promise<UpdateResult> {
    return this.dealService.removeDeal(id, request.user.id);
  }

  @ApiImplicitBody({
    name: 'body',
    required: true,
    type: class {
      notificationMethod: string;
      new() {}
    },
  })
  @Roles('$authenticated')
  @Post(':id([0-9]+)')
  public async claimDeal(
    @Param('id', new ParseIntPipe()) id: number,
    @Body('notificationMethod') notifMethod: NotificationMethod,
    @Req() request,
  ): Promise<boolean> {
    try {
      const user = request.user as User;
      const claimedUserDeal = await this.dealService.claimDeal(
        id,
        user.id,
        notifMethod,
      );

      if (!claimedUserDeal) {
        return false;
      }

      const locale = user.locale;
      if (notifMethod === NotificationMethod.SMS) {
        const smsNotification = this.dealService.composeClaimedDealSMS(
          claimedUserDeal.deal,
          user.mobileNumber,
        );
        await this.notificationService.sendTextMessage(smsNotification);
      } else {
        const emailNotification = await this.dealService.composeDealClaimedEmail(
          claimedUserDeal.id,
          locale,
        );
        await this.notificationService.sendEmailMessage(
          emailNotification,
          locale,
        );
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin, SiteAdmin)
  @ApiOperation({ title: 'Create Presigned Url for S3' })
  @Post('photo/presign')
  public async createPresignedPost(
    @Body(new RequiredPipe()) dealPresignDto: DealPresignDto,
  ): Promise<any> {
    return this.dealService.createPresignedPost(dealPresignDto);
  }

  /** Public retrieval of Deal images */
  @ApiOperation({ title: 'Proxy coupon photo from S3' })
  @Get('photo/file/:fileKey')
  public proxyFile(
    @Param('fileKey') fileKey: string,
    @Req() request,
    @Res() response,
    @Next() next,
  ): any {
    this.dealService.proxyFile(fileKey, request, response, next);
  }
}
