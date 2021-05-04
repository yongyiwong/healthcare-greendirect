import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBiotrackUserTable1574964038707
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "biotrack_user_log" (
        "id" SERIAL NOT NULL,
        "status" TEXT NOT NULL,
        "message" TEXT,
        "user_count" INTEGER NOT NULL DEFAULT 0,
        "created" TIMESTAMP NOT NULL DEFAULT now( ),
        "modified" TIMESTAMP NOT NULL DEFAULT now( ),
        "organization_id" INTEGER,
        "user_id" INTEGER,
      CONSTRAINT "biotrack_user_log__id__pk" PRIMARY KEY ( "id" )
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "biotrack_user" (
        "id" SERIAL NOT NULL,
        "pos_id" TEXT NOT NULL,
        "pos_org_id" INTEGER,
        "first_name" TEXT,
        "middle_name" TEXT,
        "last_name" TEXT,
        "email" TEXT,
        "birthday" DATE,
        "medical_number" TEXT,
        "medical_expire_date" DATE,
        "license_number" TEXT,
        "license_expire_date" DATE,
        "address_line1" TEXT,
        "address_line2" TEXT,
        "city" TEXT,
        "state" TEXT,
        "postal_code" TEXT,
        "phone_number" TEXT,
        "is_sms_opt_in" BOOLEAN,
        "total_points" INTEGER,
        "total_orders" INTEGER,
        "total_spent" NUMERIC ( 10, 2 ),
        "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
        "created" TIMESTAMP,
        "modified" TIMESTAMP,
        CONSTRAINT "biotrack_user__pos_id__pos_org_id__uq" UNIQUE ( "pos_id", "pos_org_id" ),
      CONSTRAINT "biotrack_user__id__pk" PRIMARY KEY ( "id" )
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "biotrack_user_log" ADD CONSTRAINT "biotrack_user_log__organization_id__fk"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "biotrack_user_log" ADD CONSTRAINT "biotrack_user_log__user_id__fk"
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "biotrack_user_log" DROP CONSTRAINT "biotrack_user_log__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "biotrack_user_log" DROP CONSTRAINT "biotrack_user_log__organization_id__fk"`,
    );
    await queryRunner.query(`DROP TABLE "biotrack_user"`);
    await queryRunner.query(`DROP TABLE "biotrack_user_log"`);
  }
}
