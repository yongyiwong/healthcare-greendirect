import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableInvoiceAndMessageAndOrganizationRelation1584344483208
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "invoice" (
        "id" SERIAL NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'draft',
        "total_amount" numeric(7,2) NOT NULL DEFAULT 0,
        "stripe_invoice_id" character varying,
        "stripe_charge_id" character varying,
        "stripe_refund_id" character varying,
        "deleted" boolean NOT NULL DEFAULT false,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer NOT NULL,
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        "message_id" integer, CONSTRAINT "REL_310d3d1198c8e11126e66fa631" UNIQUE ("message_id"), CONSTRAINT "invoice__id__pk" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "organization" ADD "stripe_customer_id" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "stripe_receipt_email" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice"
      ADD CONSTRAINT "invoice__message_id__fk" FOREIGN KEY ("message_id") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice"
      ADD CONSTRAINT "invoice__created_by__fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT "invoice__message_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT "invoice__created_by__fk"`,
    );

    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "stripe_receipt_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "stripe_customer_id"`,
    );
    await queryRunner.query(`DROP TABLE "invoice"`);
  }
}
