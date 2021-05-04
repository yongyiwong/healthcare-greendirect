import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterOrderAddDeliveryDispensaryFee1550610274104
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "delivery_fee"`);
    await queryRunner.query(
      `ALTER TABLE "order" ADD "delivery_patient_fee" numeric(7,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "delivery_dispensary_fee" numeric(7,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_log" ALTER COLUMN "product_count" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location_log" ALTER COLUMN "product_count" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN "delivery_dispensary_fee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN "delivery_patient_fee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "delivery_fee" numeric(7,2)`,
    );
  }
}
