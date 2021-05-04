import {
  addMinutes,
  startOfDay,
  endOfDay,
  parse,
  isValid,
  format,
} from 'date-fns';

/**
 * Usage: to adjust hours for timestamp of Date-only data where hours are irrelevant.
 * @param toStart checks if date' time is to be set to 12AM+1/end of day
 */

export class ColumnDateHoursRoundingTransformer {
  toStart: boolean;
  constructor(toStart = true) {
    this.toStart = toStart;
  }

  from(value: string): string {
    return value ? format(parse(value), 'YYYY-MM-DD') : value;
  }

  /**
   * Should add 1 minute so JS will not round down the date (prev day)
   * when setting it's time to start of day
   */
  to(value: Date): Date {
    if (value && isValid(parse(value))) {
      return this.toStart
        ? addMinutes(startOfDay(parse(value)), 1)
        : endOfDay(parse(value));
    }
    return value;
  }
}
