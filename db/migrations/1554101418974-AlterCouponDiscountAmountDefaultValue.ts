import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCouponDiscountAmountDefaultValue1554101418974
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "discount_amount" SET DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "discount_amount" DROP DEFAULT`,
    );
  }
}
