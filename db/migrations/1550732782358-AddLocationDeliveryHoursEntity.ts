import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationDeliveryHoursEntity1550732782358
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "location_delivery_hour" (
      "id" SERIAL NOT NULL,
      "day_of_week" smallint NOT NULL DEFAULT 0,
      "is_open" boolean NOT NULL DEFAULT false,
      "start_time" TIME, "end_time" TIME,
      "created" TIMESTAMP NOT NULL DEFAULT now(),
      "created_by" integer,
      "modified" TIMESTAMP NOT NULL DEFAULT now(),
      "modified_by" integer,
      "location_id" integer,
      CONSTRAINT "location_delivery_hour__id__pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_delivery_hour"
      ADD CONSTRAINT "location_delivery_hour__location_id__fk" FOREIGN KEY ("location_id") REFERENCES "location"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "location_delivery_hour" DROP CONSTRAINT "location_delivery_hour__location_id__fk"`,
    );
    await queryRunner.query(`DROP TABLE "location_delivery_hour"`);
  }
}
