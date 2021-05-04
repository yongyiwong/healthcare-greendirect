import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';
export class ChangeOrderSubmittedDateToTimestamp1540788074330
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1540788074330-ChangeOrderSubmittedDateToTimestamp', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1540788074330-ChangeOrderSubmittedDateToTimestamp', 'down'),
    );
  }
}
