import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDealsAddDayOfWeek1556862123517 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "deal_day" (
        "id" SERIAL NOT NULL,
        "day_of_week" smallint NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        "modified_by" integer,
        "deal_id" integer,
        CONSTRAINT "deal_day__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_day"
        ADD CONSTRAINT "deal_day__deal_id__fk"
        FOREIGN KEY ("deal_id")
        REFERENCES "deal"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "deal_day" DROP CONSTRAINT "deal_day__deal_id__fk"`,
    );
    await queryRunner.query(`DROP TABLE "deal_day"`);
  }
}
