import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDeliverySetDeliveryStatusDefaultLowercase1561096643565
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "delivery_status" SET DEFAULT 'open'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "delivery" ALTER COLUMN "delivery_status" SET DEFAULT 'OPEN'`,
    );
  }
}
