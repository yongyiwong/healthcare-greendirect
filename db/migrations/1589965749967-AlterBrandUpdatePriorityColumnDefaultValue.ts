import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterBrandUpdatePriorityColumnTypeAndDefaultValue1589965749967
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "brand" ALTER COLUMN "priority" TYPE smallint`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand" ALTER COLUMN "priority" SET DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "brand" ALTER COLUMN "priority" SET DEFAULT 2`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand" ALTER COLUMN "priority" TYPE integer`,
    );
  }
}
