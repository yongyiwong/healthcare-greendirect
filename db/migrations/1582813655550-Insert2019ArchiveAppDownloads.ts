import { MigrationInterface, QueryRunner } from 'typeorm';

export class Insert2019ArchiveAppDownloads1582813655550
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `INSERT INTO  "public"."app_download" ("platform", "downloads", "year", "month")
      VALUES
        ('ios', 931, 2019, 12),
        ('ios', 741, 2019, 11),
        ('ios', 660, 2019, 10),
        ('ios', 757, 2019, 9),
        ('ios', 778, 2019, 8),
        ('ios', 960, 2019, 7),
        ('ios', 788, 2019, 6),
        ('ios', 736, 2019, 5),
        ('ios', 585, 2019, 4),
        ('ios', 695, 2019, 3),
        ('ios', 598, 2019, 2)
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
     DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 12
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 11
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 10
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 9
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 8
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 7
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 6
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 5
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 4
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 3
    `);
    await queryRunner.query(`
      DELETE FROM "public"."app_download" WHERE year = 2019 AND month = 2
    `);
  }
}
