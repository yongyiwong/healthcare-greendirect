import { Injectable, NotFoundException } from '@nestjs/common';
import * as _ from 'lodash';
import { format } from 'date-fns';
import { Repository } from 'typeorm';
import { ConfigService } from '@sierralabs/nest-utils';
import { InjectRepository } from '@nestjs/typeorm';

import {
  createSitemap,
  EnumChangefreq,
  ISitemapItemOptionsLoose,
  buildSitemapIndex,
  Sitemap,
} from 'sitemap';
import { Location } from '../entities/location.entity';
import { Product } from '../entities/product.entity';
import { Doctor } from '../entities/doctor.entity';
import { ProductGroup } from '../entities/product-group.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { BrandService } from '../brand/brand.service';
import { DealService } from '../deal/deal.service';

interface SMIOptions extends Partial<ISitemapItemOptionsLoose> {
  prefix?: string;
}

@Injectable()
export class SiteMapService {
  private clientBaseUrl: string;

  readonly sitemaps: { [sm: string]: (i18n?: string) => Promise<Sitemap> } = {
    default: (i18n?: string) => this.getStaticPagesMap(i18n),
    locations: (i18n?: string) => this.getLocationPagesMap(i18n),
    products: (i18n?: string) => this.getProductPagesMap(i18n),
    // K@m35h commented
    brands: (i18n?: string) => this.getBrandPagesMap(i18n),
    productSkus: (i18n?: string) => this.getProductGroupPagesMap(i18n),
    brandProducts: (i18n?: string) => this.getBrandProductPagesMap(i18n),
    deals: (i18n?: string) => this.getDealPagesMap(i18n),
    doctors: (i18n?: string) => this.getDoctorPagesMap(i18n),
  };

  constructor(
    protected readonly configService: ConfigService,
    protected readonly dealService: DealService,
    protected readonly brandService: BrandService,
    @InjectRepository(Location)
    protected readonly locationRepository: Repository<Location>,
    @InjectRepository(Product)
    protected readonly productRepository: Repository<Product>,
    @InjectRepository(Doctor)
    protected readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(ProductGroup)
    protected readonly productGroupRepository: Repository<ProductGroup>,
    @InjectRepository(Order)
    protected readonly orderRepository: Repository<Order>,
    @InjectRepository(User) protected readonly userRepository: Repository<User>,
  ) {
    const url = this.configService.get('email.clientBaseUrl');
    this.clientBaseUrl = url.indexOf('http') !== 0 ? 'https://' + url : url;
  }

  /**
   * Sitemap Outline:
   * * SiteIndexMap for list of sitemap xml.gz URLs
   * * Private methods for retrieving URL arrays from each module
   * * Helper method for composing the xml sitemap of one module (receives array of URLs)
   *
   * SiteMapIndex -> SM.GZ -> SM.XML -> SiteMapItem -> URLs
   */

  async getSitemapIndex(): Promise<string> {
    try {
      const langPrefixes = ['', 'es'];
      return this.composeSiteMapIndex(
        Object.keys(this.sitemaps),
        'xml',
        langPrefixes,
      );
    } catch (error) {
      /*
       ? should we throw or just return an empty response?
        errors might be logged negatively by crawler */
      throw error;
    }
  }

  async getSitemap(
    moduleKey: string,
    format: 'xml' | 'gzip' = 'xml',
    i18n = '',
  ): Promise<string | Buffer> {
    if (!_.has(this.sitemaps, moduleKey)) {
      throw new NotFoundException();
    }
    const sitemap: Sitemap = await this.sitemaps[moduleKey](i18n);
    return format === 'gzip' ? sitemap.toGzip() : sitemap.toXML();
  }

  private composeSiteMapIndex(
    sitemapKeys: string[],
    linksFormat: 'xml' | 'gzip' = 'xml',
    prefixes = [''],
  ): string {
    // IMPORTANT: a SiteMapIndex will use .xml extension only, but the loc contents can
    // be xml or xml.gz as preferred.
    const ext = '.xml' + (linksFormat === 'gzip' ? '.gz' : '');

    const gzipUrls = _.flatten(
      prefixes.map(prefix => {
        const prefixTmp = prefix ? `${prefix}/` : '';
        return sitemapKeys.map(sitemapKey =>
          [
            this.clientBaseUrl,
            'api',
            'site-map',
            `${prefixTmp}sitemap-${sitemapKey + ext}`,
          ].join('/'),
        );
      }),
    );

    return buildSitemapIndex({
      lastmod: format(new Date(), 'YYYY-MM-DD'),
      urls: gzipUrls,
    });
  }

  private composeSiteMap(urls, opts?: SMIOptions): Sitemap {
    return createSitemap({
      hostname: `${this.clientBaseUrl}`,
      cacheTime: 0,
      urls: urls.map(url => this.composeSitemapItem(url, opts)),
    });
  }

  private composeSitemapItem(url, opts?: SMIOptions) {
    const { lastmod, prefix } = opts || { lastmod: '', prefix: '' };
    return {
      url: prefix + url,
      ...opts,
      lastmod: (lastmod || '').toString(),
    };
  }

  /**
   * Add each data sources that retrieve URLS per sitemap group
   * List all modules' arrays of their URLs below with their own method below this comment
   * The endpoints will then be added to  single sitemapindex to bypass the 50MB/50K Url limit.
   */
  private async getStaticPagesMap(i18n = ''): Promise<Sitemap> {
    const urls = [
      '',
      '/brand',
      '/contact-us',
      '/deal',
      '/doctor/search',
      '/forgot-password',
      '/help',
      '/help/faq',
      '/help/privacy-policy',
      '/help/service-term',
      '/location/search',
      '/login/reset-password',
      '/sign-in',
      '/sign-up-business',
      '/sign-up',
    ];
    const opts: SMIOptions = {
      changefreq: EnumChangefreq.WEEKLY,
      priority: 0.8,
      prefix: i18n,
    };

    return this.composeSiteMap(urls, opts);
  }

  private async getLocationPagesMap(i18n = ''): Promise<Sitemap> {
    try {
      const locations = await this.locationRepository.find({
        where: { deleted: false },
        order: { modified: 'DESC' },
      });
      const urls = _.flatten(
        locations.map(location => [
          `/location/${location.id}`,
          `/location/${location.id}/menu`,
          `/location/${location.id}/coupons`,
          `/location/${location.id}/reviews`,
        ]),
      );
      const latestLocation = _.first(locations);
      const opts: SMIOptions = {
        changefreq: EnumChangefreq.WEEKLY,
        lastmod: !!latestLocation ? latestLocation.modified.toString() : '',
        prefix: i18n,
      };
      return this.composeSiteMap(urls, opts);
    } catch (error) {
      throw error;
    }
  }

  private async getProductPagesMap(i18n = ''): Promise<Sitemap> {
    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .innerJoinAndSelect(
          'product.location',
          'location',
          'location.deleted = false',
        )
        .andWhere('product.isInStock = true')
        .andWhere('product.deleted = false')
        .orderBy('product.modified', 'DESC')
        .getMany();

      const urls = products.map(
        product => `/location/${product.location.id}/product/${product.id}`,
      );

      const latestProduct = _.first(products);
      const opts: SMIOptions = {
        changefreq: EnumChangefreq.WEEKLY,
        lastmod: !!latestProduct ? latestProduct.modified.toString() : '',
        prefix: i18n,
      };
      return this.composeSiteMap(urls, opts);
    } catch (error) {
      throw error;
    }
  }

  // K@m35h commented
  private async getBrandPagesMap(i18n = ''): Promise<Sitemap> {
    try {
      const brands = await this.brandService.findWithFilter({
        order: {
          modified: 'DESC',
        } as any,
      });

      const urls = _.flatten(
        brands[0].map(brand => [
          `/brand/${brand.id}`,
          `/brand/${brand.id}/menu`,
          `/brand/${brand.id}/locations`,
        ]),
      );
      const latestBrand = _.first(brands[0]);
      const opts: SMIOptions = {
        changefreq: EnumChangefreq.WEEKLY,
        lastmod: !!latestBrand ? latestBrand.modified.toString() : '',
        prefix: i18n,
      };
      return this.composeSiteMap(urls, opts);
    } catch (error) {
      throw error;
    }
  }

  private async getProductGroupPagesMap(i18n = ''): Promise<Sitemap> {
    try {
      const productGroups = await this.productGroupRepository
        .createQueryBuilder('productGroup')
        .innerJoin(
          'productGroup.products',
          'products',
          'products.deleted = false AND products.isInStock = true',
        )
        .innerJoinAndSelect(
          'productGroup.brand',
          'brand',
          'brand.deleted = false',
        )
        .andWhere('productGroup.deleted = false')
        .orderBy('productGroup.modified', 'DESC')
        .getMany();
      const urls = productGroups.map(
        productGroup =>
          `/brand/${productGroup.brand.id}/product-sku/${productGroup.id}`,
      );
      const latestProductGroup = _.first(productGroups);
      const opts: SMIOptions = {
        changefreq: EnumChangefreq.WEEKLY,
        lastmod: !!latestProductGroup
          ? latestProductGroup.modified.toString()
          : '',
        prefix: i18n,
      };
      return this.composeSiteMap(urls, opts);
    } catch (error) {
      throw error;
    }
  }

  private async getBrandProductPagesMap(i18n = ''): Promise<Sitemap> {
    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .innerJoinAndSelect(
          'product.productGroup',
          'productGroup',
          'productGroup.deleted = false',
        )
        .innerJoinAndSelect(
          'productGroup.brand',
          'brand',
          'brand.deleted = false',
        )
        .where('productGroup.brand IS NOT NULL')
        .andWhere('product.isInStock = true')
        .andWhere('product.deleted = false')
        .orderBy('product.modified', 'DESC')
        .getMany();

      const urls = products.map(
        product =>
          `/brand/${product.productGroup.brand.id}/product-sku/${product.productGroup.id}/product/${product.id}`,
      );
      const latestProduct = _.first(products);
      const opts: SMIOptions = {
        changefreq: EnumChangefreq.WEEKLY,
        lastmod: !!latestProduct ? latestProduct.modified.toString() : '',
        prefix: i18n,
      };
      return this.composeSiteMap(urls, opts);
    } catch (error) {
      throw error;
    }
  }

  private async getDealPagesMap(i18n = ''): Promise<Sitemap> {
    try {
      const deals = await this.dealService.findWithFilter({
        order: {
          modified: 'DESC',
        } as any,
      });

      const urls = deals[0].map(deal => `/deal/${deal.id}`);
      const latestDeal = _.first(deals[0]);
      const opts: SMIOptions = {
        changefreq: EnumChangefreq.WEEKLY,
        lastmod: !!latestDeal ? latestDeal.modified.toString() : '',
        prefix: i18n,
      };

      return this.composeSiteMap(urls, opts);
    } catch (error) {
      throw error;
    }
  }

  private async getDoctorPagesMap(i18n = ''): Promise<Sitemap> {
    try {
      const doctors = await this.doctorRepository.find({
        where: { deleted: false },
        order: { modified: 'DESC' },
      });
      const urls = doctors.map(doctor => `/doctor/${doctor.id}`);
      const latestDoctor = _.first(doctors);
      const opts: SMIOptions = {
        changefreq: EnumChangefreq.WEEKLY,
        lastmod: !!latestDoctor ? latestDoctor.modified.toString() : '',
        prefix: i18n,
      };
      return this.composeSiteMap(urls, opts);
    } catch (error) {
      throw error;
    }
  }
}
