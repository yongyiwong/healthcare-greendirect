import { Controller, Post, Get, Patch, Body } from '@nestjs/common';
import { Roles } from '@sierralabs/nest-identity';
import { DeployService } from './deploy.service';
import { RequiredPipe } from '@sierralabs/nest-utils';

@Controller('deploy')
export class DeployController {
  constructor(protected readonly deployService: DeployService) {}

  @Roles('Admin')
  @Post()
  deploy() {
    return this.deployService.deploy();
  }

  @Roles('Admin')
  @Get()
  find() {
    return this.deployService.find();
  }

  // @Patch()
  // notify(@Body(new RequiredPipe()) networkInterfaceIds: string[]) {
  //   return this.deployService.notify(networkInterfaceIds);
  // }
}
