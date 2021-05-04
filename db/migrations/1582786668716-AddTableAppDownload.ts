import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableAppDownload1582786668716 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "app_download" (
        "id" SERIAL NOT NULL,
        "platform" text NOT NULL,
        "downloads" integer NOT NULL DEFAULT 0,
        "year" smallint NOT NULL,
        "month" smallint NOT NULL,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "app_download__id__pk" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE "app_download"`);
  }
}
