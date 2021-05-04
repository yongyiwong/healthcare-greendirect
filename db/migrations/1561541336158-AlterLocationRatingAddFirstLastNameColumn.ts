import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterLocationRatingAddFirstLastNameColumn1561541336158
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location_rating" ADD "first_name" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_rating" ADD "last_name" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location_rating" DROP COLUMN "last_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_rating" DROP COLUMN "first_name"`,
    );
  }
}
