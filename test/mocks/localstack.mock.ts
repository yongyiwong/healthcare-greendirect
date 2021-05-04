import * as _ from 'lodash';
import * as AWS from 'aws-sdk';
import { Logger } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ConfigService } from '@sierralabs/nest-utils';

import { Environments } from '../../src/app.service';

export const MOCK_LOCALSTACK_TOPIC_ARN = {
  GENERAL: 'LOCALSTACK_GENERAL',
  PH: 'TEST_TOPIC_PH',
  CV: 'TEST_TOPIC_CV',
};
export class LocalstackMock {
  configService: ConfigService;
  s3client: AWS.S3;
  snsClient: AWS.SNS;
  bucketName: string;
  region: string;
  logger = new Logger('LocalstackMock');

  constructor(private readonly module: TestingModule) {
    this.configService = module.get<ConfigService>(ConfigService);
    this.s3client = new AWS.S3(this.configService.get('storage.aws.s3'));
    this.bucketName = this.configService.get('storage.aws.s3.bucket');
    this.region =
      this.configService.get('storage.aws.s3.region') || 'us-west-2';
    const snsMockConfig = {
      endpoint: this.configService.get('notification.aws.sns.endpoint'),
    };
    if (snsMockConfig.endpoint) {
      this.snsClient = new AWS.SNS(snsMockConfig);
    }
  }

  async generate() {
    if (!(await this.isBucketExists())) {
      await this.createBucket();
    }

    // localstack generates the same ARN 'arn:aws:sns:us-west-2:123456789012:TEST_TOPIC_PH'
    // Adds general list, and two sample organizations ARNs
    if (this.snsClient) {
      const environment = process.env.NODE_ENV as Environments;
      if ([Environments.TEST, Environments.DEV].includes(environment)) {
        await Promise.all(
          _.values(MOCK_LOCALSTACK_TOPIC_ARN).map(topic =>
            this.createTopic(topic),
          ),
        );
      }
    }
  }

  async isBucketExists() {
    const params: AWS.S3.Types.HeadBucketRequest = {
      Bucket: this.bucketName,
    };
    try {
      const exist = await this.s3client.headBucket(params).promise();
      return exist ? Promise.resolve(true) : Promise.resolve(false);
    } catch (error) {
      this.logger.log(error);
      return Promise.resolve(false);
    }
  }

  async createBucket(): Promise<AWS.S3.Types.CreateBucketOutput> {
    const params: AWS.S3.Types.CreateBucketRequest = {
      ACL: 'public-read',
      Bucket: this.bucketName,
    };
    return await this.s3client.createBucket(params).promise();
  }

  async createTopic(topicName: string): Promise<AWS.SNS.CreateTopicResponse> {
    const params: AWS.SNS.Types.CreateTopicInput = {
      Name: topicName,
    };
    return this.snsClient.createTopic(params).promise();
  }
}
