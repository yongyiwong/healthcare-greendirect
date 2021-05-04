import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';

const environment = process.env.NODE_ENV || '(development)';

//  npx jest --config test / jest - e2e.json - t "AppController_E2E" --coverage

describe('AppController_E2E', () => {
  const { name, version } = require(process.cwd() + '/package.json');
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /api', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200, { name, version, environment });
  });

  describe('/site-map', async () => {
    const baseUrl = '/site-map';

    it('GET /sitemap.xml', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap.xml`)
        .expect('Content-Type', /xml/)
        .expect(200);
    });

    it('GET /sitemap-default.xml', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-default.xml`)
        .expect('Content-Type', /xml/)
        .expect(200);
    });

    it('GET /sitemap-locations.xml', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-locations.xml`)
        .expect('Content-Type', /xml/)
        .expect(200);
    });

    it('GET /sitemap-products.xml', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-products.xml`)
        .expect('Content-Type', /xml/)
        .expect(200);
    });

    it('GET /sitemap-brands.xml', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-brands.xml`)
        .expect('Content-Type', /xml/)
        .expect(200);
    });

    it('GET /sitemap-productSkus.xml', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-productSkus.xml`)
        .expect('Content-Type', /xml/)
        .expect(200);
    });

    it('GET /sitemap-brandProducts.xml', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-brandProducts.xml`)
        .expect('Content-Type', /xml/)
        .expect(200);
    });

    it('GET /sitemap-deals.xml', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-deals.xml`)
        .expect('Content-Type', /xml/)
        .expect(200);
    });
  });

  describe('/site-map gzip endpoints', async () => {
    const baseUrl = '/site-map';

    it('should have no gzip for sitemapindex', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap.xml.gz`)
        .expect(404);
    });

    it('GET /sitemap-default.xml.gz', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-default.xml.gz`)
        .expect('Content-Type', 'application/xml+gzip')
        .expect(200);
    });

    it('GET /sitemap-locations.xml.gz', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-locations.xml.gz`)
        .expect('Content-Type', 'application/xml+gzip')
        .expect(200);
    });

    it('GET /sitemap-products.xml.gz', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-products.xml.gz`)
        .expect('Content-Type', 'application/xml+gzip')
        .expect(200);
    });

    it('GET /sitemap-brands.xml.gz', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-brands.xml.gz`)
        .expect('Content-Type', 'application/xml+gzip')
        .expect(200);
    });

    it('GET /sitemap-productSkus.xml.gz', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-productSkus.xml.gz`)
        .expect('Content-Type', 'application/xml+gzip')
        .expect(200);
    });

    it('GET /sitemap-brandProducts.xml.gz', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-brandProducts.xml.gz`)
        .expect('Content-Type', 'application/xml+gzip')
        .expect(200);
    });

    it('GET /sitemap-deals.xml.gz', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-deals.xml.gz`)
        .expect('Content-Type', 'application/xml+gzip')
        .expect(200);
    });

    it('GET /sitemap-doctors.xml.gz', () => {
      return request(app.getHttpServer())
        .get(`${baseUrl}/sitemap-doctors.xml.gz`)
        .expect('Content-Type', 'application/xml+gzip')
        .expect(200);
    });

    // TODO add tests for checking COntent-Length not exceed 50MB?
    // it('GET /sitemap-doctors.xml.gz', () => {
    //   return request(app.getHttpServer())
    //     .get(`${baseUrl}/sitemap-doctors.xml.gz`)
    //     .expect('Content-Length', () => {
    //       /* what to put */
    //     });
    // });
  });
});
