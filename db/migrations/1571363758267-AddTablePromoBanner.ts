import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTablePromoBanner1571363758267 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "promo_banner" (
      "id" SERIAL NOT NULL, "name" text NOT NULL,
      "banner_url" text,
      "banner_mobile_url" text,
      "is_active" boolean NOT NULL DEFAULT false,
      "created" TIMESTAMP NOT NULL DEFAULT now(),
      "created_by" integer,
      "modified" TIMESTAMP NOT NULL DEFAULT now(),
      "modified_by" integer,
      CONSTRAINT "promo_banner__id__pk" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE "promo_banner"`);
  }
}
