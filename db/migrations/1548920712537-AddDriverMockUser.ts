import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddDriverMockUser1548920712537 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(getSql('1548920712537-AddDriverMockUser', 'up'));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(getSql('1548920712537-AddDriverMockUser', 'down'));
  }
}
