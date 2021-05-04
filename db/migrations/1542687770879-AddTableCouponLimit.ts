import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddTableCouponLimit1542687770879 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(getSql('1542687770879-AddTableCouponLimit', 'up'));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1542687770879-AddTableCouponLimit', 'down'),
    );
  }
}
