import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddDeliveryFieldsToOrder1544421264533
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1544421264533-AddDeliveryFieldsToOrder', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1544421264533-AddDeliveryFieldsToOrder', 'down'),
    );
  }
}
