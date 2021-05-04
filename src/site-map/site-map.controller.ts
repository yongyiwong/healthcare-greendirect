import { Controller, Get, Res, Param } from '@nestjs/common';
import { SiteMapService } from './site-map.service';

@Controller('site-map')
export class SiteMapController {
  constructor(private readonly siteMapService: SiteMapService) {}
  /**
   * Reference: https://support.google.com/webmasters/answer/75712
   * Uses SiteMapIndex to breakdown into smaller sitemap.xml endpoints
   */
  @Get('sitemap.xml')
  public async getSiteMapIndex(@Res() res) {
    try {
      res.header('Content-Type', 'text/xml');
      res.send(await this.siteMapService.getSitemapIndex());
    } catch (error) {
      throw error;
    }
  }

  @Get('sitemap-:key.xml')
  public async getSiteMapXML(@Res() res, @Param('key') key) {
    let xml;
    try {
      xml = (await this.siteMapService.getSitemap(key)) as string;
    } catch (error) {
      throw error;
    }
    res.header('Content-Type', 'text/xml');
    res.send(xml);
  }

  @Get('sitemap-:key.xml.gz')
  public async getSiteMapGZ(@Res() res, @Param('key') key) {
    let gz;
    try {
      gz = (await this.siteMapService.getSitemap(key, 'gzip')) as Buffer;
    } catch (error) {
      throw error;
    }
    res.header('Content-Type', 'application/xml+gzip');
    res.header('Content-Encoding: gzip');
    res.send(gz);
  }

  @Get(':i18n/sitemap-:key.xml')
  public async getSiteMapXMLByI18n(
    @Res() res,
    @Param('i18n') i18n,
    @Param('key') key,
  ) {
    let xml;
    try {
      xml = (await this.siteMapService.getSitemap(key, null, i18n)) as string;
    } catch (error) {
      throw error;
    }
    res.header('Content-Type', 'text/xml');
    res.send(xml);
  }

  @Get(':i18n/sitemap-:key.xml.gz')
  public async getSiteMapGZByI18n(
    @Res() res,
    @Param('i18n') i18n,
    @Param('key') key,
  ) {
    let gz;
    try {
      gz = (await this.siteMapService.getSitemap(key, 'gzip', i18n)) as Buffer;
    } catch (error) {
      throw error;
    }
    res.header('Content-Type', 'application/xml+gzip');
    res.header('Content-Encoding: gzip');
    res.send(gz);
  }
}
