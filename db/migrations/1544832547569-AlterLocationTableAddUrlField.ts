import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AlterLocationTableAddUrlField1544832547569
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1544832547569-AlterLocationTableAddUrlField', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1544832547569-AlterLocationTableAddUrlField', 'down'),
    );
  }
}
