import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCouponChangeFlagsDefaultValues1552982037969
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "apply_with_other" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "is_auto_apply" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "is_for_pickup" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "is_visible" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "is_for_delivery" SET DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "is_visible" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "is_for_pickup" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "is_auto_apply" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "apply_with_other" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ALTER COLUMN "is_for_delivery" SET DEFAULT false`,
    );
  }
}
