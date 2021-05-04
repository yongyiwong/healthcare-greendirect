import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterOrganizationAddtextTopicArn1563475730506
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "text_topic_arn" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "text_topic_arn"`,
    );
  }
}
