import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State } from '../entities/state.entity';

@Injectable()
export class StateService {
  constructor(
    @InjectRepository(State)
    protected readonly stateRepository: Repository<State>,
  ) {}

  public async findAll(): Promise<[State[], number]> {
    const query = this.stateRepository
      .createQueryBuilder('state')
      .select([
        'state.id as id',
        'state.name as name',
        'state.abbreviation as abbreviation',
        'state.country as country',
        'state.stateType as "stateType"',
        'state.assocPress as "assocPress"',
        'state.standardFederalRegion as "standardFederalRegion"',
        'state.censusRegion as "censusRegion"',
        'state.censusRegionName as "censusRegionName"',
        'state.censusDivision as "censusDivision"',
        'state.censusDivisionName as "censusDivisionName"',
        'state.circuitCourt as "circuitCourt"',
        'state.created as created',
      ])
      .orderBy('state.name');
    const count = await query.getCount();
    const rawMany = await query.getRawMany();
    return [rawMany, count];
  }

  public async findById(id: number): Promise<State> {
    if (!id) throw new BadRequestException('id not provided');
    return this.stateRepository.findOne(id);
  }
}
