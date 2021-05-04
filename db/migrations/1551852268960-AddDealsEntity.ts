import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealsEntity1551854220550 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "deal" (
        "id" SERIAL NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "image_url" text,
        "start_date" TIMESTAMP,
        "end_date" TIMESTAMP,
        "expiration_date" TIMESTAMP,
        "deleted" boolean NOT NULL DEFAULT false,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        "modified_by" integer,
      CONSTRAINT "deal__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "location_deal" (
        "id" SERIAL NOT NULL,
        "deleted" boolean NOT NULL DEFAULT false,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        "modified_by" integer,
        "deal_id" integer,
        "location_id" integer,
      CONSTRAINT "location_deal__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_deal" (
        "id" SERIAL NOT NULL,
        "date_claimed" TIMESTAMP,
        "date_used" TIMESTAMP,
        "deleted" boolean NOT NULL DEFAULT false,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        "modified_by" integer,
        "deal_id" integer,
        "user_id" integer,
      CONSTRAINT "user_deal__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_deal" ADD CONSTRAINT "location_deal__deal_id__fk" FOREIGN KEY ("deal_id") REFERENCES "deal"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_deal" ADD CONSTRAINT "location_deal__location_id__fk" FOREIGN KEY ("location_id") REFERENCES "location"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_deal" ADD CONSTRAINT "user_deal__deal_id__fk" FOREIGN KEY ("deal_id") REFERENCES "deal"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_deal" ADD CONSTRAINT "user_deal__user_id__fk" FOREIGN KEY ("user_id") REFERENCES "user"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user_deal" DROP CONSTRAINT "user_deal__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_deal" DROP CONSTRAINT "user_deal__deal_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_deal" DROP CONSTRAINT "location_deal__location_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_deal" DROP CONSTRAINT "location_deal__deal_id__fk"`,
    );
    await queryRunner.query(`DROP TABLE "user_deal"`);
    await queryRunner.query(`DROP TABLE "location_deal"`);
    await queryRunner.query(`DROP TABLE "deal"`);
  }
}
