import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDealAddDealIdColumn1567753435680
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "deal" ADD "deal_id" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "deal" DROP COLUMN "deal_id"`);
  }
}
