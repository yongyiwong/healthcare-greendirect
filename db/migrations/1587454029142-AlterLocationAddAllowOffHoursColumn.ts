import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterLocationAddAllowOffHoursColumn1587454029142
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location" ADD "allow_off_hours" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location" DROP COLUMN "allow_off_hours"`,
    );
  }
}
