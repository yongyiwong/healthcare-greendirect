import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserMarketingTable1562888760096
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "user_marketing" ("id" SERIAL NOT NULL, "text_marketing_subscription_arn" text,
      "created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(),
      "user_id" integer NOT NULL, "organization_id" integer, CONSTRAINT "user_marketing__id__pk"
      PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "user_marketing" ADD CONSTRAINT "user_marketing__user_id__fk" FOREIGN KEY
      ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_marketing" ADD CONSTRAINT "user_marketing__organization_id__fk" FOREIGN KEY
      ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO user_marketing (
        "user_id",
        "text_marketing_subscription_arn"
        )
      SELECT id, text_marketing_subscription_arn
      FROM "user"
      WHERE "user"."text_marketing_subscription_arn" IS NOT NULL AND NOT EXISTS (
          SELECT 1
          FROM user_marketing AS um
          WHERE um.user_id = "user".id
          )`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "text_marketing_subscription_arn"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "text_marketing_subscription_arn" text`,
    );
    await queryRunner.query(
      `UPDATE "user"
      SET "text_marketing_subscription_arn" = user_marketing.text_marketing_subscription_arn
      FROM user_marketing
      WHERE user_marketing.user_id = "user".id
      AND user_marketing.text_marketing_subscription_arn IS NOT NULL AND user_marketing.organization_id IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_marketing" DROP CONSTRAINT "user_marketing__organization_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_marketing" DROP CONSTRAINT "user_marketing__user_id__fk"`,
    );
    await queryRunner.query(`DROP TABLE "user_marketing"`);
  }
}
