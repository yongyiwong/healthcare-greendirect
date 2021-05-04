import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNotesToOrder1556774656203 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "order" ADD "user_notes" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "user_notes"`);
  }
}
