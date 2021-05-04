import { ExpectedException } from './gd-expected.exception';

/**
 * Application-wide common interfaces
 */

export interface RootResponse {
  name: string;
  version: string;
  environment?: string;
}

/**
 * Used to type object-literal properties with ExpectedException
 * storing the expected exceptions.
 * The resulting object can be tested separately or reused in other layers.
 *
 * @example
 * /// for user.exceptions
 * UserExceptions = {
 *    loginFailed: {
 *        message: 'Login credentials incorrect',
 *        httpStatus: HttpStatus.UNAUTHORIZED,
 *        failCondition: (data) => ( ... your validation code here ),
 *        i18n: {
 *          'es-PR': 'Override default message with i18n string'
 *        }
 *    }
 *    /// add more properties of the same type ExpectedException, depending on your needs
 * }
 */
export interface ExpectedExceptionMap {
  [key: string]: ExpectedException;
}
