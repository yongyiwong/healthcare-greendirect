import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDeliveryAddLocationId1549918372618
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "delivery" ADD "location_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "delivery" ADD CONSTRAINT "delivery__location_id__fk" FOREIGN KEY ("location_id") REFERENCES "location"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "delivery" DROP CONSTRAINT "delivery__location_id__fk"`,
    );
    await queryRunner.query(`ALTER TABLE "delivery" DROP COLUMN "location_id"`);
  }
}
