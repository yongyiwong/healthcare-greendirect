import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterMessageAddOrganizations1562888537072
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "message__created_by__fk" FOREIGN KEY ("created_by") REFERENCES "user"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD "organization_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "message__organization_id__fk" FOREIGN KEY ("organization_id")
      REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "message__organization_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP COLUMN "organization_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "message__created_by__fk"`,
    );
  }
}
