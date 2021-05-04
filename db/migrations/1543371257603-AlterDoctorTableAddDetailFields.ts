import { MigrationInterface, QueryRunner } from 'typeorm';
import { getSql } from './utils/migration.util';

export class AlterDoctorTableAddDetailFields1543371257603
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1543371257603-AlterDoctorTableAddDetailFields', 'up'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return queryRunner.query(
      getSql('1543371257603-AlterDoctorTableAddDetailFields', 'down'),
    );
  }
}
