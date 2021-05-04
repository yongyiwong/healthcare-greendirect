import { Controller, Query, Get } from '@nestjs/common';
import { ApiImplicitQuery } from '@nestjs/swagger';

import { SearchService } from './search.service';
import { SearchCountDto } from '../common/search-count.dto';
import { SearchScrubberPipe } from '../common/pipes/search-scrubber.pipe';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('count')
  @ApiImplicitQuery({ name: 'query', required: false })
  @ApiImplicitQuery({ name: 'category', required: false })
  public async getSearchCount(
    @Query('query', new SearchScrubberPipe()) search?: string,
    @Query('category') category?: string,
  ): Promise<SearchCountDto> {
    return this.searchService.getSearchCount({ search, category });
  }
}
