import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorForAutoGenerateMigrations1549325141111
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user_location" DROP CONSTRAINT IF EXISTS "user_assignment_user_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" DROP CONSTRAINT IF EXISTS "user_assignment_location_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identification" DROP CONSTRAINT IF EXISTS "user_identification_location_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_coupon" DROP CONSTRAINT IF EXISTS "location_coupon_location_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_coupon" DROP CONSTRAINT IF EXISTS "location_coupon_coupon_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_limit_category" DROP CONSTRAINT IF EXISTS "coupon_limit_category_coupon_limit_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_limit" DROP CONSTRAINT IF EXISTS "coupon_limit_coupon_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_day" DROP CONSTRAINT IF EXISTS "coupon_day_coupon_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" DROP CONSTRAINT IF EXISTS "form_business_listing_state_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" DROP CONSTRAINT IF EXISTS "form_business_listing_user_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_contact" DROP CONSTRAINT IF EXISTS "form_contact_state_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_contact" DROP CONSTRAINT IF EXISTS "form_contact_user_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT IF EXISTS "order_delivery_state_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_coupon" DROP CONSTRAINT IF EXISTS "order_coupon_coupon_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_coupon" DROP CONSTRAINT IF EXISTS "order_coupon_order_id_fkey"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "user_location_id_seq" OWNED BY "user_location"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ALTER COLUMN "id" SET DEFAULT nextval('user_location_id_seq')`,
    );
    await queryRunner.query(
      `SELECT setval('user_location_id_seq', (SELECT MAX(id) FROM user_location), TRUE)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ALTER COLUMN "is_delivery_available" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor" ALTER COLUMN "priority" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" ALTER COLUMN "state_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE location_log SET product_count = 0 WHERE product_count IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_log" ALTER COLUMN "product_count" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT IF EXISTS "order__order_tax_id__fk"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "order_tax_id_seq" OWNED BY "order_tax"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "id" SET DEFAULT nextval('order_tax_id_seq')`,
    );
    await queryRunner.query(
      `SELECT setval('order_tax_id_seq', (SELECT MAX(id) FROM order_tax), TRUE);`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "state_tax" TYPE numeric(7,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "muni_tax" TYPE numeric(7,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "others" TYPE numeric(7,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ALTER COLUMN "is_delivery" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "order__order_tax_id__uq" UNIQUE ("order_tax_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ADD CONSTRAINT "user_location__user_id__fk" FOREIGN KEY ("user_id") REFERENCES "user"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ADD CONSTRAINT "user_location__location_id__fk" FOREIGN KEY ("location_id") REFERENCES "location"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identification" ADD CONSTRAINT "user_identification__location_id__fk"
       FOREIGN KEY ("location_id") REFERENCES "location"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_coupon" ADD CONSTRAINT "location_coupon__coupon_id__fk" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_coupon" ADD CONSTRAINT "location_coupon__location_id__fk" FOREIGN KEY ("location_id") REFERENCES "location"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_limit_category" ADD CONSTRAINT "coupon_limit_category__coupon_limit_id__fk"
       FOREIGN KEY ("coupon_limit_id") REFERENCES "coupon_limit"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_limit" ADD CONSTRAINT "coupon_limit__coupon_id__fk" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_day" ADD CONSTRAINT "coupon_day__coupon_id__fk" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" ADD CONSTRAINT "form_business_listing__user_id__fk" FOREIGN KEY ("user_id") REFERENCES "user"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" ADD CONSTRAINT "form_business_listing__state_id__fk" FOREIGN KEY ("state_id") REFERENCES "state"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_contact" ADD CONSTRAINT "form_contact__user_id__fk" FOREIGN KEY ("user_id") REFERENCES "user"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_contact" ADD CONSTRAINT "form_contact__state_id__fk" FOREIGN KEY ("state_id") REFERENCES "state"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "order__order_tax_id__fk" FOREIGN KEY ("order_tax_id") REFERENCES "order_tax"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "order__delivery_state_id__fk" FOREIGN KEY ("delivery_state_id") REFERENCES "state"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_coupon" ADD CONSTRAINT "order_coupon__order_id__fk" FOREIGN KEY ("order_id") REFERENCES "order"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_coupon" ADD CONSTRAINT "order_coupon__coupon_id__fk" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id")`,
    );
    await queryRunner.query(`DROP SEQUENCE IF EXISTS user_assignment_id_seq`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS order_tax_id__seq`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "order_coupon" DROP CONSTRAINT "order_coupon__coupon_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_coupon" DROP CONSTRAINT "order_coupon__order_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "order__delivery_state_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "order__order_tax_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_contact" DROP CONSTRAINT "form_contact__state_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_contact" DROP CONSTRAINT "form_contact__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" DROP CONSTRAINT "form_business_listing__state_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" DROP CONSTRAINT "form_business_listing__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_day" DROP CONSTRAINT "coupon_day__coupon_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_limit" DROP CONSTRAINT "coupon_limit__coupon_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_limit_category" DROP CONSTRAINT "coupon_limit_category__coupon_limit_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_coupon" DROP CONSTRAINT "location_coupon__location_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_coupon" DROP CONSTRAINT "location_coupon__coupon_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identification" DROP CONSTRAINT "user_identification__location_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" DROP CONSTRAINT "user_location__location_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" DROP CONSTRAINT "user_location__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "order__order_tax_id__uq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ALTER COLUMN "is_delivery" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "others" TYPE numeric(5,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "muni_tax" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "state_tax" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "id" SET DEFAULT nextval('order_tax_id__seq'`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE "order_tax_id_seq"`);
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "order__order_tax_id__fk"
       FOREIGN KEY ("order_tax_id") REFERENCES "order_tax"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_log" ALTER COLUMN "product_count" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" ALTER COLUMN "state_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor" ALTER COLUMN "priority" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ALTER COLUMN "is_delivery_available" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ALTER COLUMN "id" SET DEFAULT nextval('user_assignment_id_seq'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE "user_location_id_seq"`);
    await queryRunner.query(
      `ALTER TABLE "order_coupon" ADD CONSTRAINT "order_coupon_order_id_fkey"
       FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_coupon" ADD CONSTRAINT "order_coupon_coupon_id_fkey"
       FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "order_delivery_state_id_fkey"
       FOREIGN KEY ("delivery_state_id") REFERENCES "state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_contact" ADD CONSTRAINT "form_contact_user_id_fkey"
       FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_contact" ADD CONSTRAINT "form_contact_state_id_fkey"
       FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" ADD CONSTRAINT "form_business_listing_user_id_fkey"
       FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_business_listing" ADD CONSTRAINT "form_business_listing_state_id_fkey"
       FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_day" ADD CONSTRAINT "coupon_day_coupon_id_fkey"
       FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_limit" ADD CONSTRAINT "coupon_limit_coupon_id_fkey"
       FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_limit_category" ADD CONSTRAINT "coupon_limit_category_coupon_limit_id_fkey"
       FOREIGN KEY ("coupon_limit_id") REFERENCES "coupon_limit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_coupon" ADD CONSTRAINT "location_coupon_coupon_id_fkey"
       FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_coupon" ADD CONSTRAINT "location_coupon_location_id_fkey"
       FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identification" ADD CONSTRAINT "user_identification_location_id_fkey"
       FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ADD CONSTRAINT "user_assignment_location_id_fkey"
       FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ADD CONSTRAINT "user_assignment_user_id_fkey"
       FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
