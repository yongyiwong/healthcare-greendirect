aws ecr get-login --no-include-email --region us-west-2 | /bin/bash
docker build -t greendirect-staging --build-arg NODE_ENV=staging --build-arg NPM_TOKEN .
docker tag greendirect-staging:latest 241940929212.dkr.ecr.us-west-2.amazonaws.com/greendirect-staging:latest
docker push 241940929212.dkr.ecr.us-west-2.amazonaws.com/greendirect-staging:latest
