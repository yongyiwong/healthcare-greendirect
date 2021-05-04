import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFreewayTables1565998006023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "freeway_user_phone" (
            "pos_id" integer NOT NULL,
            "org_id" integer,
            "type" text,
            "number" text,
            "active" boolean,
            "sms" boolean,
            "created" TIMESTAMP,
            "modified" TIMESTAMP,
            "deleted" TIMESTAMP,
            "freeway_user_id" integer,
            CONSTRAINT "freeway_user_phone__pos_id__pk" PRIMARY KEY ("pos_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "freeway_user_identification" (
            "pos_id" integer NOT NULL,
            "org_id" integer,
            "type" text,
            "id_number" text,
            "state" text,
            "active" boolean,
            "file_id" integer,
            "is_renewal" boolean,
            "effective" TIMESTAMP,
            "expires" TIMESTAMP,
            "created" TIMESTAMP,
            "modified" TIMESTAMP,
            "deleted" TIMESTAMP,
            "freeway_user_id" integer,
            CONSTRAINT "freeway_user_identification__pos_id__pk" PRIMARY KEY ("pos_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "freeway_user" (
            "pos_id" integer NOT NULL,
            "first_name" text,
            "middle_name" text,
            "last_name" text,
            "email" text,
            "gender" text,
            "birthday" date,
            "active" boolean,
            "unsubscribed" boolean NOT NULL DEFAULT FALSE,
            "has_bwell" boolean NOT NULL DEFAULT FALSE,
            "primary_facility_id" integer,
            "physician_name" text,
            "physician_license" text,
            "physician_address" text,
            "diagnosis" text,
            "type" text,
            "preferred_contact" text,
            "tax_exempt" boolean,
            "order_count_week" integer,
            "order_count_month" integer,
            "order_count_90_days" integer,
            "total_points" integer,
            "total_orders" integer,
            "total_spent" text,
            "favorite_flower_item_name" text,
            "favorite_edible_item_name" text,
            "favorite_concentrate_item_name" text,
            "favorite_topical_item_name" text,
            "favorite_flower_item_id" integer,
            "favorite_edible_item_id" integer,
            "favorite_concentrate_item_id" integer,
            "favorite_topical_item_id" integer,
            "created" TIMESTAMP,
            "modified" TIMESTAMP,
            CONSTRAINT "freeway_user__pos_id__pk" PRIMARY KEY ("pos_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "freeway_user_address" (
            "pos_id" integer NOT NULL,
            "org_id" integer,
            "street_address_1" text,
            "street_address_2" text,
            "city" text,
            "providence_code" text,
            "postal_code" text,
            "country_code" text,
            "primary" boolean,
            "active" boolean,
            "created" TIMESTAMP,
            "modified" TIMESTAMP,
            "deleted" TIMESTAMP,
            "freeway_user_id" integer,
            CONSTRAINT "freeway_user_address__pos_id__pk" PRIMARY KEY ("pos_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "freeway_user_log" (
            "id" SERIAL NOT NULL,
            "organization_id" integer,
            "user_id" integer,
            "status" text NOT NULL,
            "message" text,
            "user_count" integer NOT NULL DEFAULT 0,
            "created" TIMESTAMP NOT NULL DEFAULT now(),
            "modified" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "freeway_user_log__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_identification"
            ADD CONSTRAINT "freeway_user_identification__freeway_user_id__fk"
            FOREIGN KEY ("freeway_user_id") REFERENCES "freeway_user"("pos_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_phone"
            ADD CONSTRAINT "freeway_user_phone__freeway_user_id__fk"
            FOREIGN KEY ("freeway_user_id") REFERENCES "freeway_user"("pos_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_address"
            ADD CONSTRAINT "freeway_user_address__freeway_user_id__fk"
            FOREIGN KEY ("freeway_user_id") REFERENCES "freeway_user"("pos_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_log"
            ADD CONSTRAINT "freeway_user_log__organization_id__fk"
            FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_log"
            ADD CONSTRAINT "freeway_user_log__user_id__fk"
            FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "freeway_user_log" DROP CONSTRAINT "freeway_user_log__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_log" DROP CONSTRAINT "freeway_user_log__organization_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_address" DROP CONSTRAINT "freeway_user_address__freeway_user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_phone" DROP CONSTRAINT "freeway_user_phone__freeway_user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "freeway_user_identification" DROP CONSTRAINT "freeway_user_identification__freeway_user_id__fk"`,
    );
    await queryRunner.query(`DROP TABLE "freeway_user_log"`);
    await queryRunner.query(`DROP TABLE "freeway_user_address"`);
    await queryRunner.query(`DROP TABLE "freeway_user"`);
    await queryRunner.query(`DROP TABLE "freeway_user_phone"`);
    await queryRunner.query(`DROP TABLE "freeway_user_identification"`);
  }
}
