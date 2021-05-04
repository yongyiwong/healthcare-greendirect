import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterBrandAddPriorityColumn1584668166862
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "brand" ADD "priority" integer NOT NULL DEFAULT 2`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "priority"`);
  }
}
