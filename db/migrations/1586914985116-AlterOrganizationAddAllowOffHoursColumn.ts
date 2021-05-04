import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterOrganizationAddAllowOffHoursColumn1586914985116
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "allow_off_hours" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "allow_off_hours"`,
    );
  }
}
