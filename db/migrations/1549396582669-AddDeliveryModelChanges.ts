import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveryModelChanges1549396582669
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `CREATE TABLE "delivery" ("id" SERIAL NOT NULL, "delivery_status" text, "created" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, "modified" TIMESTAMP NOT NULL DEFAULT now(), "modified_by" integer, "driver_user_id" integer, CONSTRAINT "delivery__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `CREATE TABLE "delivery_log" ("id" SERIAL NOT NULL, "delivery_status" text, "created" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, "delivery_id" integer, "driver_user_id" integer, CONSTRAINT "delivery_log__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `CREATE TABLE "order_issue" ("id" SERIAL NOT NULL, "issue_type" character varying NOT NULL, "comment" text, "created" TIMESTAMP NOT NULL DEFAULT now(), "order_id" integer, "user_id" integer, CONSTRAINT "order_issue__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `CREATE TABLE "order_log" ("id" SERIAL NOT NULL, "delivery_verified" boolean NOT NULL DEFAULT false, "received_amount" numeric(7,2), "note" text, "payment_completed_date" TIMESTAMP, "created" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, "order_id" integer, CONSTRAINT "order_log__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "payment_completed_date" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "delivery_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "received_amount" numeric(7,2)`,
    );
    await queryRunner.query(`ALTER TABLE "order" ADD "note" text`);
    await queryRunner.query(`ALTER TABLE "order" ADD "delivery_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "delivery" ADD CONSTRAINT "delivery__driver_user_id__fk" FOREIGN KEY ("driver_user_id") REFERENCES "user"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log__delivery_id__fk" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log__driver_user_id__fk" FOREIGN KEY ("driver_user_id") REFERENCES "user"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "order__delivery_id__fk" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" ADD CONSTRAINT "order_issue__order_id__fk" FOREIGN KEY ("order_id") REFERENCES "order"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" ADD CONSTRAINT "order_issue__user_id__fk" FOREIGN KEY ("user_id") REFERENCES "user"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_log" ADD CONSTRAINT "order_log__order_id__fk" FOREIGN KEY ("order_id") REFERENCES "order"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "order_log" DROP CONSTRAINT "order_log__order_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" DROP CONSTRAINT "order_issue__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" DROP CONSTRAINT "order_issue__order_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "order__delivery_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" DROP CONSTRAINT "delivery_log__driver_user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" DROP CONSTRAINT "delivery_log__delivery_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" DROP CONSTRAINT "delivery__driver_user_id__fk"`,
    );
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "delivery_id"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "note"`);
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN "received_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN "delivery_verified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN "payment_completed_date"`,
    );
    await queryRunner.query(`DROP TABLE "order_log"`);
    await queryRunner.query(`DROP TABLE "order_issue"`);
    await queryRunner.query(`DROP TABLE "delivery_log"`);
    await queryRunner.query(`DROP TABLE "delivery"`);
  }
}
