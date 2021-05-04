import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorForAutoGenerateMigrations1549325141112
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "order_tax" ALTER COLUMN "id" SET DEFAULT nextval('order_tax_id_seq')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_location" ALTER COLUMN "id" SET DEFAULT nextval('user_location_id_seq');`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
