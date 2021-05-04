import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserAddLocaleColumn1550207831197
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "locale" citext NOT NULL DEFAULT 'en-US'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "locale"`);
  }
}
