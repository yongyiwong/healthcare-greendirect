import {
  Body,
  Controller,
  Delete,
  Get,
  Next,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiImplicitQuery,
  ApiOperation,
  ApiUseTags,
} from '@nestjs/swagger';
import { OwnerInterceptor, Roles } from '@sierralabs/nest-identity';
import {
  ParseBooleanPipe,
  ParseEntityPipe,
  RequiredPipe,
} from '@sierralabs/nest-utils';
import { UpdateResult } from 'typeorm';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { Coupon } from '../entities/coupon.entity';
import { RoleEnum } from '../roles/roles.enum';
import { CouponService } from './coupon.service';
import { CouponPhotoPresignDto } from './dto/coupon-photo-presign.dto';

const { Admin, SiteAdmin, Employee } = RoleEnum;
@ApiBearerAuth()
@ApiUseTags('Coupons')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Roles(Admin, SiteAdmin, Employee)
  @Get()
  @UsePipes(new SearchValidationPipe(Coupon))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'locationId', required: false })
  @ApiImplicitQuery({ name: 'includeExpired', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  @ApiImplicitQuery({ name: 'includeNotVisible', required: false })
  public async getCoupons(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('locationId') locationId?: number,
    @Query('includeExpired', new ParseBooleanPipe()) includeExpired?: boolean,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
    @Query('includeNotVisible', new ParseBooleanPipe())
    includeNotVisible?: boolean,
  ): Promise<[Coupon[], number]> {
    return this.couponService.getCoupons(
      search,
      page,
      limit,
      order,
      locationId,
      includeExpired,
      includeDeleted,
      includeNotVisible,
    );
  }

  @Roles(Admin, SiteAdmin, Employee)
  @Get(':id([0-9]+)')
  @ApiImplicitQuery({ name: 'locationId', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async getOne(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('locationId') locationId?: number,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<Coupon> {
    return this.couponService.findCouponById(id, locationId, includeDeleted);
  }

  @Roles(Admin, SiteAdmin)
  @Post()
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  public async create(
    @Body(new RequiredPipe()) coupon: Coupon,
  ): Promise<Coupon> {
    return this.couponService.createCoupon(coupon);
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
    coupon: Coupon,
  ): Promise<Coupon> {
    coupon.id = id;
    return this.couponService.updateCoupon(coupon);
  }

  @Roles(Admin, SiteAdmin)
  @Delete(':id([0-9]+)')
  public async remove(
    @Param('id') id: number,
    @Req() request,
  ): Promise<UpdateResult> {
    return this.couponService.removeCoupon(id, request.user.id);
  }

  @Roles(Admin, SiteAdmin)
  @ApiOperation({ title: 'Create Presigned Url for S3' })
  @Post('photo/presign')
  public async createPresignedPost(
    @Body(new RequiredPipe()) couponPhotoPresignDto: CouponPhotoPresignDto,
  ): Promise<any> {
    return this.couponService.createPresignedPost(couponPhotoPresignDto);
  }

  @ApiOperation({ title: 'Proxy coupon photo from S3' })
  @Get('photo/file/:fileKey')
  public proxyFile(
    @Param('fileKey') fileKey: string,
    @Req() request,
    @Res() response,
    @Next() next,
  ): any {
    this.couponService.proxyFile(fileKey, request, response, next);
  }
}
