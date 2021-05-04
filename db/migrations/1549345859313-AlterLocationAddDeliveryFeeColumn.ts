import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterLocationAddDeliveryFeeColumn1549345859313
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location" ADD "delivery_fee" numeric(7,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD "delivery_fee_patient_percentage" numeric(2,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location" DROP COLUMN "delivery_fee_patient_percentage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP COLUMN "delivery_fee"`,
    );
  }
}
