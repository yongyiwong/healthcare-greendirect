import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAddressIdNicknameLongLatColumnToUserAddressOrder1550737011742
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "order" ADD "delivery_nickname" text`);
    await queryRunner.query(
      `ALTER TABLE "order" ADD "delivery_address_reference_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD IF NOT EXISTS "nickname" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD IF NOT EXISTS "long_lat" point`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN "long_lat"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN "nickname"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN "delivery_address_reference_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN "delivery_nickname"`,
    );
  }
}
