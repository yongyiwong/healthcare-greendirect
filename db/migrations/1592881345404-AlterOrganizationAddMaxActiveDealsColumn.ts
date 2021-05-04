import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterOrganizationAddMaxActiveDealsColumn1592881345404
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "max_active_deals" smallint NOT NULL DEFAULT 50`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "max_active_deals"`,
    );
  }
}
