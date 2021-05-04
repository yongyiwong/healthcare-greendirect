import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiUseTags } from '@nestjs/swagger';

import { State } from '../entities/state.entity';
import { StateService } from './state.service';

@ApiBearerAuth()
@ApiUseTags('States')
@Controller('states')
export class StateController {
  constructor(protected readonly stateService: StateService) {}

  @Get()
  public async getStates(): Promise<[State[], number]> {
    try {
      return this.stateService.findAll();
    } catch (error) {
      throw error;
    }
  }
}
