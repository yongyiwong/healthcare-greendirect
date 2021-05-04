const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const log = require('fancy-log');
const AWS = require('aws-sdk');
const request = require('request');
const { spawn } = require('child_process');
const merge = require('merge-stream');
const package = require('./package.json');
const zip = require('gulp-zip');
const s3 = require('gulp-s3');

const environment = process.env.NODE_ENV || 'development';
const envPath = `.env.${environment}`;
const dotenv = require('dotenv');
const env = dotenv.config({ path: path.resolve(process.cwd(), envPath) });
const deployConfigFile = `./config/deploy.${environment}.json`;
const config = require(deployConfigFile);
const projectName = config.deploy.projectName + '-' + environment;
AWS.config.update({
  accessKeyId: config.deploy.aws.accessKeyId,
  secretAccessKey: config.deploy.aws.secretAccessKey,
  region: config.deploy.aws.region,
});

/**
 * Builds the node app
 */
gulp.task('build:compile', callback => {
  execCommand('npm', ['run', 'prestart:prod'], callback);
});

gulp.task('build:transform', () => {
  return merge(
    gulp.src('./package.json').pipe(gulp.dest('build')),
    gulp.src('./dist/src/**').pipe(gulp.dest('build/dist')),
    gulp.src('./public/**').pipe(gulp.dest('build/public')),
    gulp.src('./config/keys/**').pipe(gulp.dest('build/config/keys')),
    gulp
      .src([
        'config/config-schema.json',
        'config/config.json',
        `config/config.${environment}.json`,
      ])
      .pipe(gulp.dest('build/config')),
  );
});

gulp.task('build:zip', () => {
  return gulp
    .src('./build/**')
    .pipe(zip(`${package.name}.zip`))
    .pipe(gulp.dest('./release'));
});

/**
 * Zips the build folder and send to S3
 */
gulp.task('zip:push', () => {
  return gulp.src(`release/${package.name}.zip`).pipe(
    s3(
      {
        key: config.deploy.aws.accessKeyId,
        secret: config.deploy.aws.secretAccessKey,
        bucket: config.deploy.aws.s3.bucket,
        region: config.deploy.aws.region,
      },
      // make sure to keep builds private
      { headers: { 'x-amz-acl': 'private' }, uploadPath: 'builds' },
    ),
  );
});

gulp.task('ecs:update:fast', () => {
  return new Promise((resolve, reject) => {
    const ecs = new AWS.ECS({ apiVersion: '2014-11-13' });
    const ec2 = new AWS.EC2();
    ecs.listTasks(
      {
        cluster: config.deploy.aws.ecs.cluster,
        serviceName: config.deploy.aws.ecs.service,
      },
      (error, listResult) => {
        if (error) return reject(error);
        ecs.describeTasks(
          {
            cluster: config.deploy.aws.ecs.cluster,
            tasks: listResult.taskArns,
          },
          (error, describeResult) => {
            if (error) return reject(error);

            const networkInterfaceIds = [];
            describeResult.tasks.forEach(task => {
              task.attachments.forEach(attachment => {
                if (attachment.type === 'ElasticNetworkInterface') {
                  networkInterfaceIds.push(
                    attachment.details.find(
                      detail => detail.name === 'networkInterfaceId',
                    ).value,
                  );
                }
              });
            });
          },
        );
      },
    );
  });
});

/**
 * Gets the docker login token from AWS ECR
 */
gulp.task('docker:login', callback => {
  getAuthorizationToken((error, token) => {
    if (error) {
      throw error;
    }
    let base64decoded = Buffer.from(
      token.authorizationToken,
      'base64',
    ).toString('utf8');
    base64decoded = base64decoded.replace('AWS:', '');
    execCommand(
      'docker',
      ['login', '-u', 'AWS', '-p', base64decoded, token.proxyEndpoint],
      callback,
    );
  });
});

/**
 * Creates the Docker Image
 */
gulp.task('docker:build', callback => {
  process.env.NPM_TOKEN = config.deploy.npmToken;
  execCommand(
    'docker',
    [
      'build',
      '-t',
      projectName,
      '--build-arg',
      'NODE_ENV=' + environment,
      '--build-arg',
      'NPM_TOKEN',
      '.',
    ],
    callback,
  );
});

/**
 * Tags the docker image for ECR deployment
 */
gulp.task('docker:tag', callback => {
  const ecrLabel = config.deploy.aws.ecr.uri + ':' + config.deploy.aws.ecr.tag;
  execCommand(
    'docker',
    ['tag', projectName + ':' + config.deploy.aws.ecr.tag, ecrLabel],
    callback,
  );
});

/**
 * Pushes the image to ECR
 */
gulp.task('docker:push', callback => {
  const ecrLabel = config.deploy.aws.ecr.uri + ':' + config.deploy.aws.ecr.tag;
  execCommand('docker', ['push', ecrLabel], callback);
});

/**
 * Force ECS to redeploy tasks with new image
 */
gulp.task('ecs:update', callback => {
  const ecs = new AWS.ECS({ apiVersion: '2014-11-13' });
  const params = {
    service: config.deploy.aws.ecs.service,
    cluster: config.deploy.aws.ecs.cluster,
    forceNewDeployment: true,
  };
  ecs.updateService(params, (error, data) => {
    if (error) {
      throw error;
    }
    callback();
  });
});

/**
 * Builds the project and deploys to S3 and notifies running ECS tasks to update
 */
gulp.task(
  'deploy:build',
  gulp.series(
    'build:compile',
    'build:transform',
    'build:zip',
    'zip:push',
    'ecs:update',
    // 'ecs:update:fast',
  ),
);

/**
 * Builds the project and deploys a new docker image to ECR and forces ECS to
 * update running tasks. Make sure to set `NODE_ENV` and have
 * `config/deploy.[NODE_ENV].json`.
 */
gulp.task(
  'deploy:image',
  gulp.series(
    'build:compile',
    'build:transform',
    'build:zip',
    'zip:push',
    'docker:login',
    'docker:build',
    'docker:tag',
    'docker:push',
    'ecs:update',
  ),
);

/**
 * Executes command line
 * @param {*} command
 * @param {*} args
 * @param {*} callback
 */
function execCommand(command, args, callback) {
  const ctx = spawn(command, args);
  ctx.stdout.on('data', function(data) {
    process.stdout.write(data);
  });
  ctx.stderr.on('data', function(data) {
    process.stderr.write(data);
  });
  ctx.on('close', function(code) {
    callback();
  });
}

/**
 * Get authorization token from AWS ECR
 * @param {} callback
 */
async function getAuthorizationToken(callback) {
  return new Promise((resolve, reject) => {
    const ecr = new AWS.ECR({ apiVersion: '2015-09-21' });
    ecr.getAuthorizationToken({}, (error, data) => {
      if (error) {
        log(error);
        if (callback) {
          callback(error);
        }
        return reject(error);
      }
      // log(data.authorizationData[0]);
      resolve(data.authorizationData[0]);
      if (callback) {
        callback(null, data.authorizationData[0]);
      }
    });
  });
}
