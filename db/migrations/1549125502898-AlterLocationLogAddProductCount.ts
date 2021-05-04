import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AlterLocationLogAddProductCount1549125502898
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1549125502898-AlterLocationLogAddProductCount', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1549125502898-AlterLocationLogAddProductCount', 'down'),
    );
  }
}
