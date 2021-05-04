import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDealAddPriorityColumn1589964581228
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "deal" ADD "priority" smallint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "deal" DROP COLUMN "priority"`);
  }
}
