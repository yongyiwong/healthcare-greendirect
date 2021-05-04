import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UsePipes,
  Post,
  UseInterceptors,
  Body,
  Put,
  Res,
  Next,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiImplicitQuery,
  ApiUseTags,
  ApiOperation,
} from '@nestjs/swagger';
import { Roles, OwnerInterceptor } from '@sierralabs/nest-identity';
import {
  ParseBooleanPipe,
  RequiredPipe,
  ParseEntityPipe,
} from '@sierralabs/nest-utils';

import { Brand } from '../entities/brand.entity';
import { BrandPresignedDto } from './dto/brand-presign.dto';
import { BrandService } from './brand.service';
import { LocationSearchDto } from '../location/dto/location-search.dto';
import { Product } from '../entities/product.entity';
import { ProductDto } from '../product/dto/product.dto';
import { ProductGroup } from '../entities/product-group.entity';
import { ProductGroupDto } from '../product/dto/product-group.dto';
import { ProductService } from '../product/product.service';
import { RoleEnum } from '../roles/roles.enum';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { UpdateResult } from 'typeorm';
import { ProductGroupService } from '../product/product-group.service';
import { SearchParams } from '../common/search-params.interface';

const { Admin } = RoleEnum;

@ApiBearerAuth()
@ApiUseTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
    private readonly productService: ProductService,
    private readonly productGroupService: ProductGroupService,
  ) {}

  @Get()
  @UsePipes(new SearchValidationPipe(Brand))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'shuffleBaseValue', required: false })
  @ApiImplicitQuery({ name: 'publishDate', required: false })
  @ApiImplicitQuery({ name: 'unpublishDate', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async getBrands(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('shuffleBaseValue') shuffleBaseValue?: number,
    @Query('publishDate') publishDate?: number,
    @Query('unpublishDate') unpublishDate?: number,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<[Brand[], number]> {
    try {
      return this.brandService.findWithFilter({
        search,
        page,
        limit,
        order,
        shuffleBaseValue,
        publishDate,
        unpublishDate,
        includeDeleted,
      });
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin)
  @Post()
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  public async create(@Body(new RequiredPipe()) brand: Brand): Promise<Brand> {
    return this.brandService.createBrand(brand);
  }

  @Roles(Admin)
  @Put(':id([0-9]+)')
  @UseInterceptors(new OwnerInterceptor(['modifiedBy']))
  public async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    brand: Brand,
  ): Promise<Brand> {
    brand.id = id;
    return this.brandService.updateBrand(brand);
  }

  @Get(':id([0-9]+)')
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async getOne(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<Brand> {
    return this.brandService.findById(id, includeDeleted);
  }

  @Roles(Admin)
  @Delete(':id([0-9]+)')
  public async remove(
    @Param('id', new ParseIntPipe()) id: number,
    @Req() request,
  ): Promise<UpdateResult> {
    return this.brandService.removeBrand(id, request.user.id);
  }

  @Get(':brandId([0-9]+)/product-groups/:productGroupId([0-9]+)')
  public async getOneProductGroup(
    @Param('productGroupId', new ParseIntPipe()) productGroupId: number,
    @Param('brandId', new ParseIntPipe()) brandId: number,
  ): Promise<ProductGroup> {
    try {
      return this.productService.findProductGroupById(productGroupId, brandId);
    } catch (error) {
      throw error;
    }
  }

  @Get(':brandId([0-9]+)/product-groups/:productGroupId([0-9]+)/products')
  @UsePipes(new SearchValidationPipe(Product))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'includeAllStock', required: false })
  @ApiImplicitQuery({ name: 'startFromLat', required: false })
  @ApiImplicitQuery({ name: 'startFromLong', required: false })
  public async getProductsByProductGroup(
    @Param('productGroupId', new ParseIntPipe()) productGroupId: number,
    @Param('brandId', new ParseIntPipe()) brandId: number,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('includeAllStock') includeAllStock?: boolean,
    @Query('startFromLat') startFromLat?: number,
    @Query('startFromLong') startFromLong?: number,
  ): Promise<[ProductDto[], number]> {
    try {
      return this.productService.getProductsByProductGroup(
        search,
        page,
        limit,
        order,
        includeAllStock,
        productGroupId,
        brandId,
        startFromLat,
        startFromLong,
      );
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin)
  @ApiOperation({ title: 'Create Presigned Url for S3' })
  @Post('photo/presign')
  public async createPresignedPost(
    @Body(new RequiredPipe()) brandPresignDto: BrandPresignedDto,
  ): Promise<any> {
    return this.brandService.createPresignedPost(brandPresignDto);
  }

  /** Public retrieval of Brand images */
  @ApiOperation({ title: 'Proxy brand photo from S3' })
  @Get('photo/file/:fileKey')
  public proxyFile(
    @Param('fileKey') fileKey: string,
    @Req() request,
    @Res() response,
    @Next() next,
  ): any {
    this.brandService.proxyFile(fileKey, request, response, next);
  }

  @Get(':id([0-9]+)/product-groups')
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  @ApiImplicitQuery({ name: 'includeAllStock', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'category', required: false })
  public async getBrandProductGroups(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
    @Query('includeAllStock', new ParseBooleanPipe()) includeAllStock?: boolean,
    @Query('order') order?: string,
    @Query('category') category?: string,
  ): Promise<[ProductGroupDto[], number]> {
    try {
      const searchParams: SearchParams = {
        brandId: id,
        includeDeleted,
        includeAllStock,
        order,
        category,
      };
      return this.productGroupService.getProductGroups(searchParams);
    } catch (error) {
      throw error;
    }
  }

  @Get(':id([0-9]+)/locations')
  @ApiImplicitQuery({ name: 'startFromLat', required: false })
  @ApiImplicitQuery({ name: 'startFromLong', required: false })
  public async getBrandLocations(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('startFromLat') startFromLat?: number,
    @Query('startFromLong') startFromLong?: number,
  ): Promise<LocationSearchDto[]> {
    try {
      return this.brandService.getBrandLocations(
        id,
        startFromLat,
        startFromLong,
      );
    } catch (error) {
      throw error;
    }
  }
}
