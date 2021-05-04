import { MigrationInterface, QueryRunner } from 'typeorm';
export class AlterProductAddHiddenColumn1578550861979
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD "hidden" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "hidden"`);
  }
}
