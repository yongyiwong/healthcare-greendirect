import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class ChangeEffectiveExpirationDateConstraint1542679488047
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1542679488047-ChangeEffectiveExpirationDateConstraint', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1542679488047-ChangeEffectiveExpirationDateConstraint', 'down'),
    );
  }
}
