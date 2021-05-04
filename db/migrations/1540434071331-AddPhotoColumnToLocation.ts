import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AddPhotoColumnToLocation1540434071331
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1540434071331-AddPhotoColumnToLocation', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1540434071331-AddPhotoColumnToLocation', 'down'),
    );
  }
}
