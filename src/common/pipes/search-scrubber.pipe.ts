import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SearchScrubberPipe implements PipeTransform {
  transform(value: any = '', metadata: ArgumentMetadata) {
    const WILDCARD_CHARACTERS = /[%_]/; // SQL Wildcard Characters %, _
    const scrubbedSearchTerm = (value + '').replace(
      WILDCARD_CHARACTERS,
      char => `\\${char}`,
    );
    return scrubbedSearchTerm.trim();
  }
}
