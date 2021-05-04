import * as compression from 'compression';
import * as express from 'express';
import * as path from 'path';
import * as s3Proxy from 's3-proxy';

import {LoggerService, NotFoundException} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@sierralabs/nest-utils';

import { AppModule } from './app.module';
import { ErrorFilter } from './common/error/error.filter';
import { TaskRunner, TaskType } from './task-runner';
import { GreenDirectLogger } from './greendirect-logger';

/**
 * Start the Green Direct API Nest JS App
 */
async function bootstrap() {
  const packageInfo = require(process.cwd() + '/package.json');
  const logger: LoggerService = new GreenDirectLogger('Main');
  let nestFactoryOptions;

  const environment = process.env.NODE_ENV || 'development';

  if (environment !== 'development') {
    // used in AWS environment since cloudwatch doesn't format fancy logging properly
    nestFactoryOptions = {
      // logger: this.logger,
    };
  }
  logger.log(`Environment  : ${environment}`);
  logger.log(`Version      : ${packageInfo.version}`);

  const expressServer = express();
  expressServer.use(compression());
  const app = await NestFactory.create(
    AppModule,
    expressServer,
    nestFactoryOptions,
  );
  app.enableCors({ origin: '*' });
  const configService = new ConfigService();
  const port = configService.get('http.port') || 3000;
  const isExplorer = configService.get('api.explorer');
  const explorerPath = configService.get('api.explorerPath') || 'api';
  const basePath = configService.get('api.basePath') || '';

  app.setGlobalPrefix(basePath);

  app.useGlobalFilters(new ErrorFilter());

  if (isExplorer) {
    const options = new DocumentBuilder()
      .setBasePath(basePath)
      .setTitle('Project')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      // .addTag('tag')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(explorerPath, app, document);
  }

  /*
   * Apply middleware to asset calls, especially to
   * implement HTTP Proxy for greendirect-web hosted on S3
   * For staging / production only: development is allowed but loads staging WEB instance
   */
  if (environment !== 'test') {
    expressServer.get('*', (request, response, next) => {
      if (request.path.startsWith('/api')) {
        return next();
      }

      /* 1. Subroutes (except for root) with slash are redirected to non-slash to proceed to step 2. */
      if (request.path.endsWith('/') && request.path.length > 1) {
        const removeTrailingSlash = url => {
          const [_path, query] = url.split('?');
          return _path.slice(0, -1) + (!!query ? `?${query}` : '');
        };
        response.redirect(301, removeTrailingSlash(request.originalUrl));
        return;
      }

      const hasFileExtension = path.extname(request.originalUrl);
      const hasQueryString = request.originalUrl.includes('?');
      const options = {
        bucket: configService.get('client.aws.bucket'),
        accessKeyId: configService.get('client.aws.accessKeyId'),
        secretAccessKey: configService.get('client.aws.secretAccessKey'),
        defaultKey: 'index.html',
      };

      /* 2. Routes with slashes already removed, (except for root, to be handled in step 3.)
        If a URL has querystring then assume it should be handled via angular and not an asset
        extension for example would extract a period regardless of file name or part of querystring */
      if (!hasFileExtension || hasQueryString) {
        /* Main landing pages follow S3 defaultKey: index.html (browser unaware) */
        if (request.path.startsWith('/admin')) {
          request.originalUrl = '/admin/index.html';
        } else if (request.path.startsWith('/es')) {
          request.originalUrl = '/es/index.html';
        } else {
          /* 3. Root default landing page, etc, default to English portal */
          request.originalUrl = '/index.html';
          /* 4. For sub-routes, (from 1.), don't expect an index.html. They are not landing pages. */
          if (request.path !== '/') {
            delete options.defaultKey;
          }
        }
      }

      const referer = request.header('Referer');
      // logger.log(`${referer} ${request.method} ${request.originalUrl}`);
      s3Proxy(options)(request, response, error => {
        if (error && error.status === 404) {
          response.type('json');
          return next(new NotFoundException());
        }
        next(error);
      });
    });
  }
  await app.listen(port);
}

if (process.env.TASK) {
  const taskRunner = new TaskRunner(process.env.TASK as TaskType);
  taskRunner.run();
} else {
  bootstrap();
}
