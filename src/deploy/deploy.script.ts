/**
 * Used when docker container starts for the first time to get the latest
 * build from AWS S3.
 */

import { DeployService } from './deploy.service';
import { ConfigService } from '@sierralabs/nest-utils';

const configService = new ConfigService();
const deployService = new DeployService(configService);

(async () => {
  try {
    await deployService.updateLatest();
  } catch (error) {
    // tslint:disable-next-line
    console.error('error', error);
    process.exit(1); // abort with non-zero code
  }
})();
