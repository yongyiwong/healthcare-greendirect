import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTablePromoBanner1575598468395 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "promo_banner" ADD "sequence_number" smallint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "promo_banner" DROP COLUMN "sequence_number"`,
    );
  }
}
