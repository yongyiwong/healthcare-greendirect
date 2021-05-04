import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterLocationAddConfig1583955826152 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "location" ADD "pos_config" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "pos_config"`);
  }
}
