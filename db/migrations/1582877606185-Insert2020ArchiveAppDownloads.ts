import { MigrationInterface, QueryRunner } from 'typeorm';

export class Insert2020ArchiveAppDownloads1582877606185
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      INSERT INTO  "public"."app_download" ("platform", "downloads", "year", "month")
      VALUES ('ios', 558, 2020, 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DELETE FROM "public"."app_download" WHERE year = 2020 AND month = 1`,
    );
  }
}
