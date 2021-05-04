import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMobileCheckInTable1573802716230
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "mobile_check_in" (
        "id" SERIAL NOT NULL,
        "mobile_number" text NOT NULL,
        "is_claimed" boolean NOT NULL DEFAULT false,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        "location_id" integer,
        CONSTRAINT "mobile_check_in__id__pk" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "mobile_check_in"
      ADD CONSTRAINT "mobile_check_in__location_id__fk"
      FOREIGN KEY ("location_id") REFERENCES "location"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "mobile_check_in"
      DROP CONSTRAINT "mobile_check_in__location_id__fk"`,
    );
    await queryRunner.query(`DROP TABLE "mobile_check_in"`);
  }
}
