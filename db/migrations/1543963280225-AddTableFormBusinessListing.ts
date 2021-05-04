import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddTableFormBusinessListing1543963280225
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1543963280225-AddTableFormBusinessListing', 'up'),
    );
  }
  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1543963280225-AddTableFormBusinessListing', 'down'),
    );
  }
}
