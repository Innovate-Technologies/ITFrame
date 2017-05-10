#!/bin/bash

docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
docker tag innovate/itframe:latest innovate/itframe:$TRAVIS_TAG
docker push innovate/itframe:latest
docker push innovate/itframe:$TRAVIS_TAG