import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AlterLocationAddNotificationMobileNumber1547831635374
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1547831635374-AlterLocationAddNotificationMobileNumber', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1547831635374-AlterLocationAddNotificationMobileNumber', 'down'),
    );
  }
}
