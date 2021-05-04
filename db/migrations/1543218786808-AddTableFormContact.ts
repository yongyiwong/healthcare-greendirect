import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddTableFormContact1543218786808 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(getSql('1543218786808-AddTableFormContact', 'up'));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1543218786808-AddTableFormContact', 'down'),
    );
  }
}
