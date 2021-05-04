import * as AWS from 'aws-sdk';
import * as log from 'fancy-log';
import { RunTaskRequest } from 'aws-sdk/clients/ecs';

import {
  ConflictException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@sierralabs/nest-utils';

@Injectable()
export class SynchronizeService {
  config: any;
  ecs: AWS.ECS;

  constructor(private readonly configService: ConfigService) {
    this.config = configService.get('client.aws');
    AWS.config.update({
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      region: this.config.ecs ? this.config.ecs.region : 'us-west-2',
    });
    this.ecs = new AWS.ECS({ apiVersion: '2014-11-13' });
  }

  async launchInventorySynchronizeTask(userId: number): Promise<any> {
    const results = await this.getSynchronizeTasks();
    let isAlreadyRunning = false;
    for (const task of results.tasks) {
      if (task.overrides && task.overrides.containerOverrides) {
        for (const overrides of task.overrides.containerOverrides) {
          if (overrides.environment && overrides.environment.length > 0) {
            for (const variable of overrides.environment) {
              if (
                variable.name === 'TASK' &&
                variable.value === 'SYNCHRONIZE_INVENTORY'
              ) {
                isAlreadyRunning = true;
                break;
              }
            }
          }
        }
      }
    }
    if (!isAlreadyRunning) {
      return this.runAwsTask(userId);
    } else {
      throw new ConflictException('Synchronization is already running.');
    }
  }

  async getSynchronizeTasks(): Promise<any> {
    const tasksArns = await this.getAwsTaskList();
    return this.getAwsTaskDefinition(tasksArns);
  }

  private async runAwsTask(userId: number): Promise<any> {
    if (!this.config.ecs) {
      throw new NotImplementedException('Missing AWS Config');
    }
    return new Promise((resolve, reject) => {
      const params: RunTaskRequest = {
        taskDefinition: this.config.ecs.taskDefinition,
        cluster: this.config.ecs.cluster,
        count: 1,
        launchType: 'FARGATE',
        networkConfiguration: {
          awsvpcConfiguration: {
            assignPublicIp: 'ENABLED', // needed otherwise task gets prematurely terminated
            subnets: this.config.ecs.subnets,
            securityGroups: this.config.ecs.securityGroups,
          },
        },
        overrides: {
          containerOverrides: [
            {
              name: this.config.ecs.container,
              command: ['node', 'dist/main.js'],
              environment: [
                {
                  name: 'TASK',
                  value: 'SYNCHRONIZE_INVENTORY',
                },
                {
                  name: 'CREATED_BY',
                  value: userId.toString(),
                },
              ],
            },
          ],
        },
      };
      log.info('Synchronize Service Running ECS Task');
      this.ecs.runTask(params, (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(data);
      });
    });
  }

  private async getAwsTaskList(): Promise<any> {
    if (!this.config.ecs) {
      throw new NotImplementedException('Missing AWS Config');
    }
    return new Promise((resolve, reject) => {
      const params = {
        cluster: this.config.ecs.cluster,
        family: this.config.ecs.family,
      };
      this.ecs.listTasks(params, (error, data) => {
        if (error) {
          return reject(error);
        }
        // TODO: account for `nextToken` if a lot of tasks exists
        resolve(data.taskArns);
      });
    });
  }

  private async getAwsTaskDefinition(taskArns: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const params = { tasks: taskArns, cluster: this.config.ecs.cluster };
      this.ecs.describeTasks(params, (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(data);
      });
    });
  }
}
