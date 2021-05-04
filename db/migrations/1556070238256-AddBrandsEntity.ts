import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrandsEntity1554877747756 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "brand" (
        "id" SERIAL NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "image_url" text,
        "url" text,
        "publish_date" TIMESTAMP,
        "unpublish_date" TIMESTAMP,
        "deleted" boolean NOT NULL DEFAULT false,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        "modified_by" integer,
        CONSTRAINT "brand__id__pk" PRIMARY KEY ("id")
        )`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_group" (
        "id" SERIAL NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "category" text,
        "image_url" text,
        "deleted" boolean NOT NULL DEFAULT false,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        "modified_by" integer,
        "brand_id" integer,
        CONSTRAINT "product_group__id__pk" PRIMARY KEY ("id")
        )`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "product_group_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_group"
        ADD CONSTRAINT "product_group__brand_id__fk"
        FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product"
        ADD CONSTRAINT "product__product_group_id__fk"
        FOREIGN KEY ("product_group_id") REFERENCES "product_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "product__product_group_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_group" DROP CONSTRAINT "product_group__brand_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "product_group_id"`,
    );
    await queryRunner.query(`DROP TABLE "product_group"`);
    await queryRunner.query(`DROP TABLE "brand"`);
  }
}
