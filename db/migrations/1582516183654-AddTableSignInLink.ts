import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableSignInLink1582516183654 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "sign_in_link" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "token" text NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "modified" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "sign_in_link__id__pk" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_in_link" ADD CONSTRAINT "sign_in_link__user_id__fk"
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "sign_in_link" DROP CONSTRAINT "sign_in_link__user_id__fk"`,
    );
    await queryRunner.query(`DROP TABLE "sign_in_link"`);
  }
}
