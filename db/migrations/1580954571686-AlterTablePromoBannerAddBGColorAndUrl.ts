import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTablePromoBannerAddBGColorAndUrl1580954571686
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "promo_banner" ADD "background_color" text`,
    );
    await queryRunner.query(`ALTER TABLE "promo_banner" ADD "click_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "promo_banner" DROP COLUMN "click_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "promo_banner" DROP COLUMN "background_color"`,
    );
  }
}
