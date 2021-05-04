import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDeliveryModelsNullableColumns1551917436528
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "delivery" DROP CONSTRAINT "delivery__location_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "modified_by" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "location_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" DROP CONSTRAINT "delivery_log__delivery_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" ALTER COLUMN "delivery_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" DROP CONSTRAINT "order_issue__order_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" DROP CONSTRAINT "order_issue__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" ALTER COLUMN "order_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_log" DROP CONSTRAINT "order_log__order_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_log" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_log" ALTER COLUMN "order_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ADD CONSTRAINT "delivery__location_id__fk" FOREIGN KEY ("location_id") REFERENCES "location"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log__delivery_id__fk" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("id")`,
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
      `ALTER TABLE "delivery_log" DROP CONSTRAINT "delivery_log__delivery_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" DROP CONSTRAINT "delivery__location_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_log" ALTER COLUMN "order_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_log" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `ALTER TABLE "order_log" ADD CONSTRAINT "order_log__order_id__fk" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_issue" ALTER COLUMN "order_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `ALTER TABLE "order_issue" ADD CONSTRAINT "order_issue__user_id__fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `ALTER TABLE "order_issue" ADD CONSTRAINT "order_issue__order_id__fk" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" ALTER COLUMN "delivery_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_log" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log__delivery_id__fk" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "location_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "modified_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      // tslint:disable-next-line:max-line-length
      `ALTER TABLE "delivery" ADD CONSTRAINT "delivery__location_id__fk" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
