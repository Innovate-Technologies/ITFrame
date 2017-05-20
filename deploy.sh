#!/bin/bash

docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
docker push innovate/itframe:latest
if [ ! -z "$TRAVIS_TAG" ]; then 
    docker tag innovate/itframe:latest innovate/itframe:$TRAVIS_TAG
    docker push innovate/itframe:$TRAVIS_TAG
fi