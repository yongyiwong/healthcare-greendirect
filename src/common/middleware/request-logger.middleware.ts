import * as log from 'fancy-log';
import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  resolve(...args: any[]): MiddlewareFunction {
    return async (req, res, next) => {
      if (req.originalUrl === '/api/locations') {
        return next();
      }
      const referer = req.header('Referer');
      log.info(`${referer} ${req.method} ${req.originalUrl} `);
      res.on('finish', () => {
        log.info(
          `${referer} ${req.method} ${req.originalUrl} ${res.statusCode} ${
            res.statusMessage
          }; ${res.get('Content-Length') || 0}b sent;`,
        );
      });
      next();
    };
  }
}
