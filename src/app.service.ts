import * as _ from 'lodash';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import { RootResponse } from './app.interface';
const readFileAsync = (file, encoding) =>
  new Promise((resolve, reject) => {
    fs.readFile(file, encoding, (err, data) =>
      err ? reject(err) : resolve(data),
    );
  });

/** NODE_ENV values used by GD */
export enum Environments {
  DEV = 'development',
  TEST = 'test', // local-server, distinct from dev
  TEST_AUTO = 'test-auto', // isolated instance meant for automation and repeated tests
  STAGING = 'staging', // paid test environment for client
  PRODUCTION = 'production', // live
}

const PRODUCTION = [Environments.STAGING, Environments.PRODUCTION];
const NON_PRODUCTION = [
  Environments.DEV,
  Environments.TEST,
  Environments.TEST_AUTO,
]; // allows workarounds for automation

/**
 *
 * @param options.includes allows a temporary override to include another environment
 */
export const isNonProduction = (options?: { includes?: Environments[] }) => {
  const env = process.env.NODE_ENV; // dont use a default
  const includes = options && options.includes ? options.includes : [];
  const nonProduction = _.concat(NON_PRODUCTION, includes);
  return env && _.includes(nonProduction, env);
};

/**
 *
 * @param options options.excepts allows a temporary override to exclude an environment
 */
export const isProductionEnv = (options?: {
  excepts?: Environments[];
  allow?: Environments[];
}) => {
  const env = process.env.NODE_ENV; // dont use a default
  const excluded = options && options.excepts ? options.excepts : [];
  const allows = options && options.allow ? options.allow : [];
  const removedExcepts = PRODUCTION.filter(e => !_.includes(excluded, e));
  const allowed = _.concat(removedExcepts, allows);
  return env && _.includes(allowed, env);
};

export const readFromFileAsync = async (filePath: string) => {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    return content.toString();
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    // For missing file, fail silently
    return '';
  }
};

@Injectable()
export class AppService {
  root(): RootResponse {
    const { name, version } = require(process.cwd() + '/package.json');
    const environment = process.env.NODE_ENV || '(development)';
    return {
      name,
      version,
      environment,
    };
  }
}
