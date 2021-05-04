import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AlterUserIdentificationAddLocationEmailFields1545922648948
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql(
        '1545922648948-AlterUserIdentificationAddLocationEmailFields',
        'up',
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql(
        '1545922648948-AlterUserIdentificationAddLocationEmailFields',
        'down',
      ),
    );
  }
}
