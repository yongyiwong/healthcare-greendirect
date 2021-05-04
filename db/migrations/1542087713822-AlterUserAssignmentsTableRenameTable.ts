import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AlterUserAssignmentsTableRenameTable1542087713822
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1542087713822-AlterUserAssignmentsTableRenameTable', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1542087713822-AlterUserAssignmentsTableRenameTable', 'down'),
    );
  }
}
