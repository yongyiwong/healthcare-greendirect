import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBiotrackUsertoUser1576881954427 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "biotrack_user" ADD "user_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "biotrack_user" ADD CONSTRAINT "biotrack_user__user_id__fk" FOREIGN KEY ("user_id")
        REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "biotrack_user" DROP CONSTRAINT "biotrack_user__user_id__fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "biotrack_user" DROP COLUMN "user_id"`,
    );
  }
}
