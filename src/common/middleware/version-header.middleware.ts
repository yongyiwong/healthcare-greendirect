import { exec } from 'child_process';
import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';

@Injectable()
export class VersionHeaderMiddleware implements NestMiddleware {
  resolve(...args: any[]): MiddlewareFunction {
    let gitVersion = null;
    const version = new Promise<any>(resolve =>
      exec('git rev-parse --short HEAD', (error, stdout, stderr) => {
        resolve(stdout.trim());
      }),
    );
    return async (req, res, next) => {
      gitVersion = await version;
      const { version: npmVersion } = require(process.cwd() + '/package.json');
      res.set('X-Version', npmVersion + '-' + gitVersion);
      next();
    };
  }
}
