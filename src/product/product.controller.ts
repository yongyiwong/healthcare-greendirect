import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseInterceptors,
  Post,
  Body,
  Req,
  Res,
  Next,
  Put,
} from '@nestjs/common';
import {
  ApiImplicitQuery,
  ApiUseTags,
  ApiOperation,
  ApiImplicitParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ParseBooleanPipe,
  RequiredPipe,
  ParseEntityPipe,
} from '@sierralabs/nest-utils';
import { Roles, OwnerInterceptor } from '@sierralabs/nest-identity';

import { ProductService } from './product.service';
import { Product } from '../entities/product.entity';
import { ProductDto } from './dto/product.dto';
import { ProductImage } from '../entities/product-image.entity';
import { ProductPhotoPresignDto } from './dto/product-photo-presign.dto';
import { RoleEnum } from '../roles/roles.enum';
import { ProductPricing } from '../entities/product-pricing.entity';
import { ProductPricingService } from './product-pricing/product-pricing.service';
import { ProductPricingWeight } from '../entities/product-pricing-weight.entity';

const { Admin, SiteAdmin } = RoleEnum;

@ApiBearerAuth()
@ApiUseTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productPricingService: ProductPricingService,
  ) {}

  @Get()
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'locationId', required: false })
  @ApiImplicitQuery({ name: 'includeAllStock', required: false })
  @ApiImplicitQuery({ name: 'includeHidden', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  @ApiImplicitQuery({ name: 'productGroupId', required: false })
  @ApiImplicitQuery({ name: 'brandId', required: false })
  public async getProducts(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('paginated') paginated?: boolean,
    @Query('order') order?: string,
    @Query('category') category?: string,
    @Query('locationId') locationId?: number,
    @Query('includeAllStock') includeAllStock?: boolean,
    @Query('includeHidden', new ParseBooleanPipe()) includeHidden?: boolean,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
    @Query('productGroupId') productGroupId?: number,
    @Query('brandId') brandId?: number,
  ): Promise<[ProductDto[], number]> {
    try {
      return this.productService.findWithFilter({
        locationId,
        search,
        page,
        limit,
        paginated,
        order,
        includeAllStock,
        includeDeleted,
        includeHidden,
        productGroupId,
        brandId,
        category,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get('categories')
  @ApiImplicitQuery({ name: 'locationId', required: false })
  @ApiImplicitQuery({ name: 'brandId', required: false })
  @ApiImplicitQuery({ name: 'includeAllStock', required: false })
  @ApiImplicitQuery({ name: 'includeHidden', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  public async getCategories(
    @Query('locationId') locationId?: number,
    @Query('brandId') brandId?: number,
    @Query('includeAllStock', new ParseBooleanPipe()) includeAllStock?: boolean,
    @Query('includeHidden', new ParseBooleanPipe()) includeHidden?: boolean,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
  ): Promise<string[]> {
    return this.productService.getProductCategories(
      locationId,
      brandId,
      includeAllStock,
      includeHidden,
      includeDeleted,
    );
  }

  @Get(':id([0-9]+)')
  @ApiImplicitQuery({ name: 'brandId', required: false })
  @ApiImplicitQuery({ name: 'productGroupId', required: false })
  @ApiImplicitQuery({ name: 'includeHidden', required: false })
  public async getProduct(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('brandId', new ParseIntPipe()) brandId?: number,
    @Query('productGroupId', new ParseIntPipe()) productGroupId?: number,
    @Query('includeHidden', new ParseBooleanPipe()) includeHidden?: boolean,
  ): Promise<Product> {
    try {
      const product = await this.productService.findById(
        id,
        null,
        productGroupId,
        brandId,
        includeHidden,
      );
      return Promise.resolve(product);
    } catch (error) {
      throw error;
    }
  }

  @Roles(Admin, SiteAdmin)
  @Post(':id([0-9]+)/photos')
  @ApiOperation({ title: 'Save all photos related to a given product' })
  public async savePhotos(
    @Param('id', new ParseIntPipe()) productId: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    photos: ProductImage[],
    @Req() request,
  ): Promise<ProductImage[]> {
    const userId: number = request.user.id;
    return this.productService.savePhotos(productId, photos, userId);
  }

  @Roles(Admin, SiteAdmin)
  @ApiOperation({ title: 'Create Presigned Url for S3' })
  @Post('photo/presign')
  public async createPresignedPost(
    @Body(new RequiredPipe()) productPhotoPresignDto: ProductPhotoPresignDto,
  ): Promise<any> {
    return this.productService.createPresignedPost(productPhotoPresignDto);
  }

  @ApiOperation({ title: 'Proxy product photo from S3' })
  @Get('photo/file/:fileKey')
  public proxyFile(
    @Param('fileKey') fileKey: string,
    @Req() request,
    @Res() response,
    @Next() next,
  ): any {
    this.productService.proxyFile(fileKey, request, response, next);
  }

  @Roles(Admin, SiteAdmin)
  @Post(':id([0-9]+)/pricing')
  @ApiImplicitParam({ name: 'id', type: Number })
  async upsertProductPricing(
    @Param('id', new ParseIntPipe()) id: number,
    @Body(new RequiredPipe()) productPricing: ProductPricing,
    @Req() request,
  ): Promise<ProductPricing> {
    productPricing.product = new Product();
    productPricing.product.id = id;
    return this.productPricingService.upsertPricing(
      productPricing,
      request.user,
    );
  }

  @Roles(Admin, SiteAdmin)
  @Post(':id([0-9]+)/pricing-weights')
  @ApiImplicitParam({ name: 'id', type: Number })
  async upsertProductWeightPricing(
    @Param('id', new ParseIntPipe()) id: number,
    @Body(new RequiredPipe()) weightPrices: ProductPricingWeight[],
    @Req() request,
  ): Promise<ProductPricingWeight[]> {
    return this.productPricingService.upsertPricingWeights(
      id,
      weightPrices,
      request.user,
    );
  }
}
