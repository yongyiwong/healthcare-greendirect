import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDealAddCategoryColumn1590551250233
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "deal" ADD "category" smallint`);
    await queryRunner.query(
      `CREATE INDEX "deal_category_idx" ON "deal" ("category") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP INDEX "deal_category_idx"`);
    await queryRunner.query(`ALTER TABLE "deal" DROP COLUMN "category"`);
  }
}
