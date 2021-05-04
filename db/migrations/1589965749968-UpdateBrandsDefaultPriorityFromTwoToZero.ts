import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBrandsDefaultPriorityFromTwoToZero1589965749968
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE "public"."brand" SET "priority" = 0 WHERE "priority" = 2`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE "public"."brand" SET "priority" = 2 WHERE "priority" = 0`,
    );
  }
}
