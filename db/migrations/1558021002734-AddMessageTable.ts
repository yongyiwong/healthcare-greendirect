import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageTable1558021002734 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "message" (
        "id" SERIAL NOT NULL, "text" text NOT NULL,
        "estimate_send_count" integer NOT NULL,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer NOT NULL,
        CONSTRAINT "message__id__pk" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "text_marketing_subscription_arn" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "message__created_by__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "text_marketing_subscription_arn"`,
    );
    await queryRunner.query(`DROP TABLE "message"`);
  }
}
