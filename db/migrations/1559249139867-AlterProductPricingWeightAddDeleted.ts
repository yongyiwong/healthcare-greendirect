import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterProductPricingWeightAddDeleted1559249139867
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "product_pricing_weight" ADD "deleted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "product_pricing_weight" DROP COLUMN "deleted"`,
    );
  }
}
