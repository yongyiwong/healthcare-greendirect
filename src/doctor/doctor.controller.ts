import {
  Controller,
  Get,
  UsePipes,
  Query,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
  Body,
  Put,
  Delete,
  Req,
  Res,
  Next,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiImplicitQuery,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { Roles, OwnerInterceptor } from '@sierralabs/nest-identity';
import { RequiredPipe, ParseEntityPipe } from '@sierralabs/nest-utils';
import { UpdateResult } from 'typeorm';

import { DoctorService } from './doctor.service';
import { Doctor } from '../entities/doctor.entity';
import { DoctorSearchDto } from './dto/doctor-search.dto';
import { DoctorPhotoPresignDto } from './dto/doctor-photo-presign.dto';
import {
  DoctorExceptions as Exceptions,
  DoctorExceptions,
} from './doctor.exceptions';
import { GDExpectedException } from '../gd-expected.exception';

@ApiBearerAuth()
@ApiUseTags('Doctors')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @ApiResponse({
    status: Exceptions.invalidStartingLatLong.httpStatus,
    description: Exceptions.invalidStartingLatLong.message,
  })
  @UsePipes(new SearchValidationPipe(Doctor))
  @ApiImplicitQuery({ name: 'search', required: false })
  @ApiImplicitQuery({ name: 'minLat', required: false })
  @ApiImplicitQuery({ name: 'minLong', required: false })
  @ApiImplicitQuery({ name: 'maxLat', required: false })
  @ApiImplicitQuery({ name: 'maxLong', required: false })
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @ApiImplicitQuery({ name: 'startFromLat', required: false })
  @ApiImplicitQuery({ name: 'startFromLong', required: false })
  public async search(
    @Query('search') search?: string,
    @Query('minLat') minLat?: number,
    @Query('minLong') minLong?: number,
    @Query('maxLat') maxLat?: number,
    @Query('maxLong') maxLong?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('startFromLat') startFromLat?: number,
    @Query('startFromLong') startFromLong?: number,
  ): Promise<[DoctorSearchDto[], number]> {
    return this.doctorService.findWithFilter({
      search,
      minLat,
      minLong,
      maxLat,
      maxLong,
      page,
      limit,
      order,
      startFromLat,
      startFromLong,
    });
  }

  @Get(':id([0-9]+)')
  public async getOne(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<Doctor> {
    try {
      const doctor = await this.doctorService.findById(id);
      GDExpectedException.try(DoctorExceptions.doctorNotFound, doctor);
      return Promise.resolve(doctor);
    } catch (error) {
      throw error;
    }
  }

  @Roles('Admin')
  @Post()
  @UseInterceptors(new OwnerInterceptor(['createdBy', 'modifiedBy']))
  public async create(
    @Body(new RequiredPipe()) doctor: Doctor,
  ): Promise<Doctor> {
    return this.doctorService.create(doctor);
  }

  @Roles('Admin')
  @Put(':id([0-9]+)')
  @UseInterceptors(new OwnerInterceptor(['modifiedBy']))
  public async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body(
      new RequiredPipe(),
      new ParseEntityPipe({ validate: { skipMissingProperties: true } }),
    )
    doctor: Doctor,
  ): Promise<Doctor> {
    doctor = await this.doctorService.update(doctor);
    return this.doctorService.findById(doctor.id); // return complete record
  }

  @Roles('Admin')
  @Delete(':id([0-9]+)')
  public async remove(
    @Param('id') id: number,
    @Req() request,
  ): Promise<UpdateResult> {
    return this.doctorService.remove(id, request.user.id);
  }

  @Roles('Admin')
  @ApiOperation({ title: 'Create Presigned Url for S3' })
  @Post('photo/presign')
  public async createPresignedPost(
    @Body(new RequiredPipe()) doctorPhotoPresignDto: DoctorPhotoPresignDto,
  ): Promise<any> {
    return this.doctorService.createPresignedPost(doctorPhotoPresignDto);
  }

  @ApiOperation({ title: 'Proxy doctor photo from S3' })
  @Get('photo/file/:fileKey')
  public proxyFile(
    @Param('fileKey') fileKey: string,
    @Req() request,
    @Res() response,
    @Next() next,
  ): any {
    this.doctorService.proxyFile(fileKey, request, response, next);
  }
}
