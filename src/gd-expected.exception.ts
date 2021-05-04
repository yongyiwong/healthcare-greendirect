import { HttpException, HttpStatus } from '@nestjs/common';

import * as _ from 'lodash';

/**
 * Simple type for organizing the exceptions to throw for expected errors / exceptions from happy path
 */
export interface ExpectedException {
  /**
   *  the user-friendly message to display.
   */
  message: string;
  /**
   *  the user-friendly message display with arguments to update message content.
   *  If null, defaults to `message`.
   *  @param context?: any arguments you need from your current context.
   */
  messageFn?: (context?: any) => string;

  /**
   * the Http Status Code to return, following HTTP standards
   */
  httpStatus: HttpStatus;
  /**
   * Checks optionally if exception should be thrown.
   * Keep this simple, light (no async or heavy transactions) and pure.
   * @param context?: any arguments you need from your current context.
   */
  failCondition?: (context?: any) => boolean;
  /**
   * Optional i18n override strings for specific-locales.
   * Extract this in front-end using the LOCALE_ID in effect there.
   * Defaults to `message`.
   */
  i18n?: { [locale: string]: string };
}

/**
 * HttpException responses for exceptions to GD business logic
 * Use this class in testing and capturing in filters so that it will be wrapped
 * into a simple JSON schema response.
 */
export class GDExpectedException extends HttpException
  implements ExpectedException {
  message: string;
  httpStatus: HttpStatus;
  i18n: { [key: string]: string };

  /**
   * Static method for running the failCondition() and throwing an HttpException
   * @param exception the ExpectedExceptionMap object
   * @param contextArgs any variable needed by failCondition/message (can be multiple values wrapped as one object)
   * @param messageFnArgs any variable needed by message to update message content. No effect if message is not a function.
   */
  static try(
    expectedException: ExpectedException,
    contextArgs?: any,
    messageFnArgs?: any,
  ) {
    if (expectedException.failCondition(contextArgs)) {
      throw new GDExpectedException(
        expectedException,
        contextArgs,
        messageFnArgs,
      );
    }
  }

  /**
   * Static method for quick throwing an ExpectedException bypassing failCondition()
   * @param exception the ExpectedException object
   * @param messageFnArgs any variable needed by message to update message content. No effect if message is not a function.
   */
  static throw(expectedException: ExpectedException, messageFnArgs?: any) {
    throw new GDExpectedException(expectedException, null, messageFnArgs);
  }

  constructor(
    public readonly expectedException: ExpectedException,
    public readonly contextArgs?: any,
    public readonly messageFnArgs?: any,
  ) {
    super(expectedException.message, expectedException.httpStatus);
    this.message =
      (expectedException.messageFn &&
        expectedException.messageFn(messageFnArgs)) ||
      expectedException.message;
    this.httpStatus = expectedException.httpStatus;
    this.i18n = !_.isEmpty(expectedException.i18n)
      ? expectedException.i18n
      : null;
  }
}
