import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddTableOrderTaxes1537846660303 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(getSql('1537846660303-AddTableOrderTaxes', 'up'));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1537846660303-AddTableOrderTaxes', 'down'),
    );
  }
}
