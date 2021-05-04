import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrgIdFreewayUser1568417503278 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "freeway_user" ADD "org_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "freeway_user" ALTER COLUMN "has_bwell" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "freeway_user" ALTER COLUMN "has_bwell" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "freeway_user" DROP COLUMN "org_id"`);
  }
}
