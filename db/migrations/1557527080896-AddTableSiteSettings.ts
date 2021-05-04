import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableSiteSettings1557527080896 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "site_settings" (
      "key" character varying NOT NULL,
      "value" character varying NOT NULL,
      "created" TIMESTAMP NOT NULL DEFAULT now(),
      "created_by" integer,
      "modified" TIMESTAMP NOT NULL DEFAULT now(),
      "modified_by" integer,
      CONSTRAINT "site_settings__key__pk" PRIMARY KEY ("key"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE "site_settings"`);
  }
}
