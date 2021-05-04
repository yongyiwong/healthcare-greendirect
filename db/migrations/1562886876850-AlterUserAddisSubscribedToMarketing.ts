import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserAddisSubscribedToMarketing1562886876850
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "is_subscribed_to_marketing" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "user"
      SET is_subscribed_to_marketing = FALSE
      WHERE "user"."text_marketing_subscription_arn" IS NULL
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE "user"
      SET is_subscribed_to_marketing = TRUE
      `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "is_subscribed_to_marketing"`,
    );
  }
}
