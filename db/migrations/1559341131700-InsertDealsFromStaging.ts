import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertDealsFromStaging1559341131700 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const locations = await queryRunner.query(`SELECT * from "location"`);
    const locationCondado = locations.find(l => l.name.includes('Condado'));
    const locationOceanPark = locations.find(l => l.name.includes('Ocean'));
    const locationOldSanJuan = locations.find(l =>
      l.name.includes('Old San Juan'),
    );
    if (locations) {
      const results = await queryRunner.query(
        // tslint:disable-next-line:max-line-length
        `INSERT INTO "public"."deal"("title", "description", "image_url", "start_date", "end_date", "expiration_date", "deleted", "created_by", "modified_by", "timezone")
            VALUES ('NextGen Caps Special- 15% off', 'Get 15% off on NextGen brand capsules-Active/Balanced/Relaxed', 'https://staging.greendirect.com/api/deals/photo/file/19_image_20190530135706.jpg', '2019-05-14 07:00:00', '2019-06-28 07:00:00', '2019-06-29 04:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ('Edibles Party Pack Special- $25', 'Purchase 5 packs of single unit edibles for $25 ***Tu Medicina or KUNI brand only***',
              'https://staging.greendirect.com/api/deals/photo/file/20_image_20190530135746.jpg', '2019-05-14 07:00:00', '2019-06-28 07:00:00',
              '2019-06-28 07:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ('Vape and Gummies Combo Deal- $65', 'Purchase any Vape and 2 packs of single unit Gummies for $65
            ***excluding Bwell and Draco Holistic Vapes***',
            'https://staging.greendirect.com/api/deals/photo/file/21_image_20190530135811.jpg', '2019-05-14 07:00:00', '2019-06-29 07:00:00',
            '2019-06-29 07:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ( 'NextGen Tincture Combo Deal- $78', 'Purchase any two tinctures for $78. ***NextGen only***',
            'https://staging.greendirect.com/api/deals/photo/file/22_image_20190530135837.jpg', '2019-05-14 07:00:00', '2019-06-29 07:00:00',
            '2019-06-29 07:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ('Free Vape Battery Special', 'Get a free Bwell or NextGen Battery Vape with any Vape Purchase ***excluding B Well vape***',
            'https://staging.greendirect.com/api/deals/photo/file/23_image_20190530135915.jpg', '2019-05-14 07:00:00', '2019-06-29 07:00:00',
            '2019-06-29 07:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ('Draco Rosa Massage Combo- $39', 'Purchase a Draco Rosa Madlove Massage and Draco Rosa Sensual Oil for $39',
            'https://staging.greendirect.com/api/deals/photo/file/24_image_20190530140007.jpg', '2019-05-14 07:00:00', '2019-06-29 07:00:00',
            '2019-06-29 07:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ('Draco Rosa MadLove Vape Special- $59', 'Purchase Draco Rosa Madlove product line Vape and Madlove Chocolate for $59',
            'https://staging.greendirect.com/api/deals/photo/file/25_image_20190530140159.jpg', '2019-05-14 07:00:00', '2019-06-29 07:00:00',
            '2019-06-29 07:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ('NextGen/KUNI Combo Special- $60', 'Purchase any NextGen Vape and get a free KUNI chocolate for $60
            ***excludes Bwell and Draco Holistic Vapes***', 'https://staging.greendirect.com/api/deals/photo/file/26_image_20190530140254.jpg',
            '2019-05-14 07:00:00', '2019-06-29 07:00:00', '2019-06-29 07:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ('Flavors Combo Special- $144', ' Purchase 3 Flavors brand Vapes for $144',
            'https://staging.greendirect.com/api/deals/photo/file/27_image_20190530140315.jpg', '2019-05-14 07:00:00', '2019-06-29 07:00:00',
            '2019-06-29 07:00:00', 'false', 1, 1, 'America/Puerto_Rico'),
            ('Flavors and Flower Special- $60', 'Flavors Vape-Buy a flavors vape and get a free gram of any kind for $60',
            'https://staging.greendirect.com/api/deals/photo/file/28_image_20190530140354.jpg', '2019-05-14 07:00:00', '2019-06-29 07:00:00',
            '2019-06-29 07:00:00', 'false', 1, 1, 'America/Puerto_Rico') RETURNING id`,
      );
      await queryRunner.query(`
          INSERT INTO "public"."deal_day"("day_of_week", "is_active", "deal_id")
          VALUES (0, 'false', ${results[0].id}),
          (1, 'true', ${results[0].id}),
          (2, 'false', ${results[0].id}),
          (3, 'true', ${results[0].id}),
          (4, 'true', ${results[0].id}),
          (5, 'true', ${results[0].id}),
          (6, 'false', ${results[0].id}),
          (0, 'false', ${results[2].id}),
          (1, 'false', ${results[2].id}),
          (2, 'false', ${results[2].id}),
          (3, 'false', ${results[2].id}),
          (4, 'true', ${results[2].id}),
          (5, 'true', ${results[2].id}),
          (6, 'false', ${results[2].id})`);

      if (locationCondado) {
        await queryRunner.query(`
            INSERT INTO "public"."location_deal" ("deleted", "created_by", "modified_by", "deal_id", "location_id")
            VALUES ('false', 1, 1, ${results[0].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[1].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[2].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[3].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[4].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[5].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[6].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[7].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[8].id}, ${locationCondado.id}),
            ('false', 1, 1, ${results[9].id}, ${locationCondado.id})
           `);
      }
      if (locationOceanPark) {
        await queryRunner.query(`
            INSERT INTO "public"."location_deal" ("deleted", "created_by", "modified_by", "deal_id", "location_id")
            VALUES ('false', 1, 1, ${results[0].id}, ${locationOceanPark.id})
            `);
      }
      if (locationOldSanJuan) {
        await queryRunner.query(`
            INSERT INTO "public"."location_deal" ("deleted", "created_by", "modified_by", "deal_id", "location_id")
            VALUES ('false', 1, 1, ${results[0].id}, ${locationOldSanJuan.id})
            `);
      }
    } else {
      return;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const deals = await queryRunner.query(
      `SELECT * from "deal WHERE title = 'NextGen Caps Special- 15% off"`,
    );
    if (deals) {
      const nextGenDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'NextGen Caps Special- 15% off'`,
      );
      const vapeComboDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'Vape and Gummies Combo Deal- $65'`,
      );
      const partyPackDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'Edibles Party Pack Special- $25'`,
      );
      const tinctureDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'NextGen Tincture Combo Deal- $78'`,
      );
      const batteryDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'Free Vape Battery Special'`,
      );
      const dracoComboDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'Draco Rosa Massage Combo- $39'`,
      );
      const dracoMadLoveDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'Draco Rosa MadLove Vape Special- $59'`,
      );
      const nextGenKUNIDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'NextGen/KUNI Combo Special- $60'`,
      );
      const flavorsComboDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'Flavors Combo Special- $144'`,
      );
      const flavorsFlowerDeal = await queryRunner.query(
        `SELECT * from deal WHERE title = 'Flavors and Flower Special- $60'`,
      );

      await queryRunner.query(
        `DELETE FROM "public"."location_deal" WHERE deal_id IN (
            ${nextGenDeal[0].id}, ${vapeComboDeal[0].id}, ${
          partyPackDeal[0].id
        }, ${tinctureDeal[0].id}, ${batteryDeal[0].id}, ${
          dracoComboDeal[0].id
        }, ${dracoMadLoveDeal[0].id}, ${nextGenKUNIDeal[0].id}, ${
          flavorsComboDeal[0].id
        }, ${flavorsFlowerDeal[0].id})`,
      );
      await queryRunner.query(
        `DELETE FROM "public"."deal_day" WHERE deal_id IN(${
          nextGenDeal[0].id
        }, ${vapeComboDeal[0].id}, ${partyPackDeal[0].id}, ${
          tinctureDeal[0].id
        }, ${batteryDeal[0].id}, ${dracoComboDeal[0].id}, ${
          dracoMadLoveDeal[0].id
        }, ${nextGenKUNIDeal[0].id}, ${flavorsComboDeal[0].id}, ${
          flavorsFlowerDeal[0].id
        })`,
      );
      await queryRunner.query(
        `DELETE FROM "public"."deal" WHERE id IN (${nextGenDeal[0].id}, ${
          vapeComboDeal[0].id
        }, ${partyPackDeal[0].id}, ${tinctureDeal[0].id}, ${
          batteryDeal[0].id
        }, ${dracoComboDeal[0].id}, ${dracoMadLoveDeal[0].id}, ${
          nextGenKUNIDeal[0].id
        }, ${flavorsComboDeal[0].id}, ${flavorsFlowerDeal[0].id})`,
      );
    } else {
      return;
    }
  }
}
