import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterLocationAddPhoneNumberDelivery1553283418496
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location" ADD "notification_delivery_mobile_number" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location" DROP COLUMN "notification_delivery_mobile_number"`,
    );
  }
}
