import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddInstructionToUserAddress1544418717617
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1544418717617-AddInstructionToUserAddress', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1544418717617-AddInstructionToUserAddress', 'down'),
    );
  }
}
