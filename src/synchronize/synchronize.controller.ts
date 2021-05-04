import { Controller, Get, Post, Query, Req, UsePipes } from '@nestjs/common';
import { ApiImplicitQuery, ApiUseTags } from '@nestjs/swagger';
import { Roles } from '@sierralabs/nest-identity';

import { SearchValidationPipe } from '../common/pipes/search-validation.pipe';
import { LocationLog } from '../entities/location-log.entity';
import { LocationLogService } from '../location/location-log.service';
import { SynchronizeService } from './synchronize.service';

@ApiUseTags('Synchronize')
@Controller('synchronize')
export class SynchronizeController {
  constructor(
    private readonly locationLogService: LocationLogService,
    private readonly synchronizeService: SynchronizeService,
  ) {}

  @Roles('Admin')
  @Post('inventory')
  synchronizeInventory(@Req() request): Promise<any> {
    const userId = request.user.id;
    return this.synchronizeService.launchInventorySynchronizeTask(userId);
  }

  @Roles('Admin')
  @UsePipes(new SearchValidationPipe(LocationLog))
  @ApiImplicitQuery({ name: 'page', required: false })
  @ApiImplicitQuery({ name: 'limit', required: false })
  @ApiImplicitQuery({ name: 'order', required: false })
  @Get('inventory')
  async getLocationLog(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
  ): Promise<any> {
    return this.locationLogService.getLocationLog(page, limit, order);
  }

  @Roles('Admin')
  @Get('tasks')
  async getSynchronizeTasks(): Promise<any> {
    return this.synchronizeService.getSynchronizeTasks();
  }
}
