import { Get, Controller } from '@nestjs/common';

import { AppService } from './app.service';
import { RootResponse } from './app.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root(): RootResponse {
    return this.appService.root();
  }
}
