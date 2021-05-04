/**
 * Consolidates falsey values (expected 0, null, undefined, '') into `null`
 *  to make sure only null makes it to db.
 */
export class ColumnFalsyToNullTransformer {
  to<T>(value: T): T {
    return value || null;
  }
  from<T>(value: T): T {
    return value;
  }
}
