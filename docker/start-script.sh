#!/bin/sh
# Attempt to download latest build from AWS S3
node dist/deploy/deploy.script
if [ $? -eq 0 ]
then
  # if successful updating build launch app
  pm2-runtime dist/main.js
else
  echo Failed to download build.
fi
