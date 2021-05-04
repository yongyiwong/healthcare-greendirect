import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UsePipes,
  UseInterceptors,
  ParseIntPipe,
  Req,
  Res,
  Next,
} from '@nestjs/common';
import { Roles, OwnerInterceptor } from '@sierralabs/nest-identity';
import { RequiredPipe, ParseBooleanPipe } from '@sierralabs/nest-utils';
import { ApiImplicitQuery, ApiOperation } from '@nestjs/swagger';

import { PromoBannerService } from './promo-banner.service';
import { PromoBanner } from '../entities/promo-banner.entity';
import { PromoBannerDto } from './promo-banner.dto';
import { RoleEnum } from '../roles/roles.enum';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { PromoBannerPhotoPresignDto } from './promo-banner-photo-presign.dto';

const { Admin } = RoleEnum;

@Controller('promo-banner')
export class PromoBannerController {
  constructor(public readonly promoBannerService: PromoBannerService) {}

  @Get()
  @UsePipes(new SearchValidationPipe(PromoBanner))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'includeInactive', required: false })
  public async findWithFilter(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('includeInactive', new ParseBooleanPipe()) includeInactive?: boolean,
  ): Promise<[PromoBanner[], number]> {
    return this.promoBannerService.findWithFilter(
      search,
      page,
      limit,
      order,
      includeInactive,
    );
  }

  @Get(':id([0-9]+)')
  public async findById(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<PromoBanner> {
    return this.promoBannerService.findById(id);
  }

  @Roles(Admin)
  @Post()
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  public async create(
    @Body(new RequiredPipe()) promoBanner: PromoBanner,
  ): Promise<PromoBanner> {
    return this.promoBannerService.create(promoBanner);
  }

  @Roles(Admin)
  @Put(':id([0-9]+)')
  @UseInterceptors(new OwnerInterceptor(['modifiedBy']))
  public async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body(new RequiredPipe()) promoBannerDto: PromoBannerDto,
  ): Promise<PromoBanner> {
    promoBannerDto.id = id;
    return this.promoBannerService.update(promoBannerDto);
  }

  @Roles(Admin)
  @ApiOperation({ title: 'Create Presigned Url for S3' })
  @Post('photo/presign')
  public async createPresignedPost(
    @Body(new RequiredPipe())
    promoBannerPhotoPresignDto: PromoBannerPhotoPresignDto,
  ): Promise<any> {
    return this.promoBannerService.createPresignedPost(
      promoBannerPhotoPresignDto,
    );
  }

  @ApiOperation({ title: 'Proxy promo banner photo from S3' })
  @Get('photo/file/:fileKey')
  public proxyFile(
    @Param('fileKey') fileKey: string,
    @Req() request,
    @Res() response,
    @Next() next,
  ): any {
    this.promoBannerService.proxyFile(fileKey, request, response, next);
  }
}
