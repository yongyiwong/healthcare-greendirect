import {
  Controller,
  Post,
  Query,
  UseInterceptors,
  Body,
  Put,
  Param,
  ParseIntPipe,
  Get,
  Req,
  Res,
  Next,
} from '@nestjs/common';
import { ApiImplicitQuery, ApiUseTags, ApiOperation } from '@nestjs/swagger';

import { Roles, OwnerInterceptor } from '@sierralabs/nest-identity';
import {
  RequiredPipe,
  ParseEntityPipe,
  ParseBooleanPipe,
} from '@sierralabs/nest-utils';

import { Product } from '../entities/product.entity';
import { ProductGroupService } from './product-group.service';
import { ProductService } from './product.service';
import { ProductGroup } from '../entities/product-group.entity';
import { ProductGroupPresignedDto } from './dto/product-group-presign.dto';
import { RoleEnum } from '../roles/roles.enum';
import { ProductGroupDto } from './dto/product-group.dto';
import { SearchParams } from '../common/search-params.interface';

const { Admin, SiteAdmin } = RoleEnum;

@ApiUseTags('Product Groups')
@Controller('product-groups')
export class ProductGroupController {
  constructor(
    private readonly productGroupService: ProductGroupService,
    private readonly productService: ProductService,
  ) {}

  @Get()
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'includeDeleted', required: false })
  @ApiImplicitQuery({ name: 'unassigned', required: false })
  public async findWithFilter(
    @Query('search') search?: string,
    @Query('order') order?: string,
    @Query('includeDeleted', new ParseBooleanPipe()) includeDeleted?: boolean,
    @Query('unassigned', new ParseBooleanPipe()) unassigned?: boolean,
  ): Promise<[ProductGroupDto[], number]> {
    const searchParams: SearchParams = {
      search,
      order,
      includeDeleted,
      includeAllStock: true,
      unassigned,
    };
    return this.productGroupService.getProductGroups(searchParams);
  }

  @Get(':id([0-9]+)')
  @ApiImplicitQuery({ name: 'brandId', required: false })
  public async getOne(
    @Param('id', new ParseIntPipe()) id: number,
    @Query('brandId', new ParseIntPipe()) brandId?: number,
  ): Promise<ProductGroup> {
    return this.productGroupService.findById(id, brandId);
  }

  @Roles(Admin, SiteAdmin)
  @Post()
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  public async createProductGroup(
    @Body(new RequiredPipe()) productGroup: ProductGroup,
  ): Promise<ProductGroup> {
    return this.productGroupService.create(productGroup);
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
    productGroup: ProductGroup,
  ): Promise<ProductGroup> {
    productGroup.id = id;
    return this.productGroupService.update(productGroup);
  }

  @Roles(Admin)
  @ApiOperation({ title: 'Create Presigned Url for S3' })
  @Post('photo/presign')
  public async createPresignedPost(
    @Body(new RequiredPipe())
    productGroupPresignedDto: ProductGroupPresignedDto,
  ): Promise<any> {
    return this.productGroupService.createPresignedPost(
      productGroupPresignedDto,
    );
  }

  /** Public retrieval of product group images */
  @ApiOperation({ title: 'Proxy product group photo from S3' })
  @Get('photo/file/:fileKey')
  public proxyFile(
    @Param('fileKey') fileKey: string,
    @Req() request,
    @Res() response,
    @Next() next,
  ): any {
    this.productGroupService.proxyFile(fileKey, request, response, next);
  }

  @Roles(Admin)
  @Post(':id([0-9]+)/products')
  public async saveProducts(
    @Param('id', new ParseIntPipe()) id: number,
    @Body(new RequiredPipe()) products: Product[],
  ): Promise<Product[]> {
    products.forEach(product => {
      product.productGroup = product.productGroup
        ? { ...new ProductGroup(), id }
        : null;
    });
    return this.productService.saveProducts(products);
  }
}
