import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCouponAddFlagsForOneTimeCouponCode1552611409888
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "coupon" ADD "is_one_time_use" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ADD "is_auto_apply" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ADD "is_for_delivery" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ADD "is_for_pickup" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ADD "is_void_delivery_fee" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon" ADD "is_visible" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "coupon" DROP COLUMN "is_visible"`);
    await queryRunner.query(
      `ALTER TABLE "coupon" DROP COLUMN "is_void_delivery_fee"`,
    );
    await queryRunner.query(`ALTER TABLE "coupon" DROP COLUMN "is_for_pickup"`);
    await queryRunner.query(
      `ALTER TABLE "coupon" DROP COLUMN "is_for_delivery"`,
    );
    await queryRunner.query(`ALTER TABLE "coupon" DROP COLUMN "is_auto_apply"`);
    await queryRunner.query(
      `ALTER TABLE "coupon" DROP COLUMN "is_one_time_use"`,
    );
  }
}
