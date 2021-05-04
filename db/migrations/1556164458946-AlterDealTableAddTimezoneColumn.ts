import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDealTableAddTimezoneColumn1556164458946
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "deal" ADD "timezone" text DEFAULT 'America/Puerto_Rico'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "deal" DROP COLUMN "timezone"`);
  }
}
