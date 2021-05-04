import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as pm2 from 'pm2';
import * as unzip from 'unzipper';
import { ProcessDescription } from 'pm2';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@sierralabs/nest-utils';

// tslint:disable-next-line:no-var-requires
const { name, version } = require(process.cwd() + '/package.json');

@Injectable()
export class DeployService {
  logger = new Logger('DeployService');

  constructor(protected readonly configService: ConfigService) {
    const config = this.configService.get('storage.aws.s3');
    AWS.config.update({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    });
  }

  /**
   * Find all running pm2 processes.
   */
  async find(): Promise<ProcessDescription[]> {
    return new Promise<ProcessDescription[]>((resolve, reject) => {
      pm2.connect(connectError => {
        if (connectError) {
          reject(connectError);
        }
        pm2.list((error, processDescriptionList) => {
          if (error) {
            reject(error);
          }
          resolve(processDescriptionList);
        });
      });
    });
  }

  /**
   * Deploys the latest build release stored on S3.
   */
  async updateLatest() {
    if (!fs.existsSync('/usr/app')) {
      throw new BadRequestException('Not a container instance.');
    }
    await this.downloadBuildFile();
    await this.unzipBuildFile();
    await this.replaceBuild();
  }

  /**
   * Deploys the latest build release stored on S3 and restarts the container
   * process.
   */
  async deploy() {
    await this.updateLatest();
    const packageJson = await this.getPackageJson();
    this.restartProcess(); // run async
    return {
      previousVersion: version,
      newVersion: packageJson.version,
    };
  }

  /**
   * Restart all pm2 processes running.
   */
  private async restartProcess() {
    const processes = await this.find();
    return new Promise((resolve, reject) => {
      processes.forEach(process =>
        pm2.restart(process.name, error => {
          if (error) {
            this.logger.error('process restart error: ', error.message);
          } else {
            this.logger.log(`process ${process.name} restarted`);
          }
        }),
      );
    });
  }

  /**
   * Read the `package.json` file from disk to get the latest version. Doing
   * this instead of relying on import for cache reasons.
   */
  private async getPackageJson(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      fs.readFile('/usr/app/package.json', (error, data) => {
        if (error) {
          reject(error);
        }
        try {
          resolve(JSON.parse(data.toString()));
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Download the build zip file into a temp folder.
   */
  private async downloadBuildFile() {
    this.logger.log('Downloading build file from S3...');
    return new Promise((resolve, reject) => {
      const config = this.configService.get('storage.aws');
      const s3 = new AWS.S3();
      const options = {
        Bucket: config.s3.buildBucket,
        Key: `builds/${name}.zip`,
      };
      const fileStream = fs
        .createWriteStream(`/usr/app/${name}.zip`)
        .on('finish', () => {
          resolve();
        })
        .on('error', reject);
      s3.getObject(options)
        .createReadStream()
        .pipe(fileStream)
        .on('error', reject);
    });
  }

  /**
   * Unzip the build file to a temp folder.
   */
  private async unzipBuildFile() {
    this.logger.log('Unzipping build file...');
    return new Promise((resolve, reject) => {
      let entryCount = 0;
      fs.createReadStream(`/usr/app/${name}.zip`)
        .pipe(unzip.Extract({ path: '/usr/app/tmp' }))
        .on('entry', entry => {
          entryCount++;
          this.logger.log(`unzipping ${entry.path}`);
        })
        .on('finish', () => {
          this.logger.log(`on finish`);
        })
        .on('close', () => {
          this.logger.log(`finished unzipping ${entryCount} files`);
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Replace the current build with the downloaded release.
   */
  private async replaceBuild() {
    this.logger.log('replacing build files');
    await this.moveFilesInFolder('/usr/app/tmp', '/usr/app');
    await this.removeTempFolder();
    this.logger.log('removing build zip file');
    fs.unlinkSync(`/usr/app/${name}.zip`);
  }

  /**
   * Recursively moves the contents of a folder to another folder.
   */
  private async moveFilesInFolder(sourcePath: string, destinationPath: string) {
    if (!fs.existsSync(sourcePath)) {
      throw new BadRequestException(`moveFiles: ${sourcePath} does not exist.`);
    }
    if (fs.lstatSync(sourcePath).isDirectory()) {
      if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath);
      }
      const files = await this.readDir(sourcePath);
      for (const fileName of files) {
        const sourceFilePath = path.join(sourcePath, fileName);
        const destinationFilePath = path.join(destinationPath, fileName);
        await this.moveFilesInFolder(sourceFilePath, destinationFilePath);
      }
    } else {
      this.logger.log(`moving ${sourcePath} to ${destinationPath}`);
      await this.moveFile(sourcePath, destinationPath);
    }
  }

  /**
   * Recursively remove the `/usr/app/tmp` folder where release builds are
   * downloaded.
   * @param filePath
   */
  private async removeTempFolder(filePath?: string) {
    if (!filePath) {
      filePath = '/usr/app/tmp';
    }
    if (!fs.existsSync(filePath)) {
      return;
    }
    this.logger.log(`removing ${filePath}`);
    if (fs.lstatSync(filePath).isDirectory()) {
      const files = await this.readDir(filePath);
      for (const fileName of files) {
        const subFilePath = path.join(filePath, fileName);
        await this.removeTempFolder(subFilePath);
      }
      await this.removeDir(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Remove a directory on the file system
   * @param folderPath
   */
  private async removeDir(folderPath): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.rmdir(folderPath, error => {
        if (error) {
          return reject(error);
        }
        resolve(true);
      });
    });
  }

  /**
   * Read files in a directory on the file system
   * @param folderPath
   */
  private async readDir(folderPath: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(folderPath, (error, files) => {
        if (error) {
          return reject(error);
        }
        resolve(files);
      });
    });
  }

  /**
   * Move file on file system
   * @param sourcePath
   * @param destinationPath
   */
  private async moveFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.rename(sourcePath, destinationPath, error => {
        if (error) {
          return reject(error);
        }
        resolve(true);
      });
    });
  }
}
