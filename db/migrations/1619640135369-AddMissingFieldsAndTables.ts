import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddMissingFieldsAndTables1619640135369 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "user_role__role_id__fk"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "user_role__user_id__fk"`);
        await queryRunner.query(
          `CREATE TABLE "delivery_time" (
            "id" SERIAL NOT NULL,
            "store_id" integer,
            "day" text,
            "time_slot" text,
            "max_orders_hour" integer,
            "day_num" integer,
            "is_active" boolean NOT NULL DEFAULT false,
            CONSTRAINT "delivery_time__id__pk" PRIMARY KEY ("id")
          )`,
        );
        await queryRunner.query(
          `CREATE TABLE "delivery_van_orders" (
            "id" SERIAL NOT NULL,
            "driver_id" integer,
            "time_slot" text,
            "max_orders_per_hour" integer,
            "counter" integer,
            "date" text,
            "location_id" integer,
            CONSTRAINT "delivery_van_orders__id__pk" PRIMARY KEY ("id")
          )`,
        );
        await queryRunner.query(
          `CREATE TABLE "driver_delivery_order" (
            "id" SERIAL NOT NULL,
            "store_id" integer,
            "driver_id" integer,
            "order_id" integer,
            "time_slot" text,
            "date" text,
            CONSTRAINT "driver_delivery_order__id__pk" PRIMARY KEY ("id")
          )`,
        );
        await queryRunner.query(
          `CREATE TABLE "store_van_mapping" (
            "id" SERIAL NOT NULL,
            "store_id" integer,
            "van_id" integer,
            CONSTRAINT "store_van_mapping__id__pk" PRIMARY KEY ("id")
          )`,
        );
        await queryRunner.query(`ALTER TABLE "location" ADD "flower_limit" integer`);
        await queryRunner.query(`ALTER TABLE "location" ADD "message" text`);
        await queryRunner.query(`ALTER TABLE "order" ADD "order_ready" character varying`);
        await queryRunner.query(`ALTER TABLE "order" ADD "delivery_time_slot" character varying`);
        await queryRunner.query(`ALTER TABLE "order" ADD "assigned_to_user_id" integer`);
        await queryRunner.query(`ALTER TABLE "order" ADD "driver_name" character varying`);
        await queryRunner.query(`ALTER TABLE "order" ADD "pos_order_id" character varying`);
        await queryRunner.query(`CREATE INDEX "user_role__user_id__idx" ON "user_role" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "user_role__role_id__idx" ON "user_role" ("role_id") `);
        await queryRunner.query(
          `ALTER TABLE "user_role" ADD CONSTRAINT "user_role__user_id__fk"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(
          `ALTER TABLE "user_role" ADD CONSTRAINT "user_role__role_id__fk"
          FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "user_role__role_id__fk"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "user_role__user_id__fk"`);
        await queryRunner.query(`DROP INDEX "user_role__role_id__idx"`);
        await queryRunner.query(`DROP INDEX "user_role__user_id__idx"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "pos_order_id"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "driver_name"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "assigned_to_user_id"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "delivery_time_slot"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "order_ready"`);
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "flower_limit"`);
        await queryRunner.query(`DROP TABLE "store_van_mapping"`);
        await queryRunner.query(`DROP TABLE "driver_delivery_order"`);
        await queryRunner.query(`DROP TABLE "delivery_van_orders"`);
        await queryRunner.query(`DROP TABLE "delivery_time"`);
        await queryRunner.query(
          `ALTER TABLE "user_role" ADD CONSTRAINT "user_role__user_id__fk"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(
          `ALTER TABLE "user_role" ADD CONSTRAINT "user_role__role_id__fk"
          FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
