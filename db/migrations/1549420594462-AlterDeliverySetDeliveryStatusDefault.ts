import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDeliverySetDeliveryStatusDefault1549420594462
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "delivery_status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "delivery_status" SET DEFAULT 'OPEN'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "delivery_status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "delivery_status" DROP NOT NULL`,
    );
  }
}
