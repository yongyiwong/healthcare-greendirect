import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddTableCoupon1539758059463 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(getSql('1539758059463-AddTableCoupon', 'up'));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(getSql('1539758059463-AddTableCoupon', 'down'));
  }
}
