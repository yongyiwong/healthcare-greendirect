import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterLocationAddPriorityColumn1581471982752
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location" ADD "priority" integer NOT NULL DEFAULT 2`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "priority"`);
  }
}
