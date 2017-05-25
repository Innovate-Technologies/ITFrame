#!/bin/bash

docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
if [[ "$TRAVIS_BRANCH" == "master" ]]; then
    docker push innovate/itframe:latest
fi
if [[ "$TRAVIS_BRANCH" == "staging" ]]; then
    docker tag innovate/itframe:latest innovate/itframe:staging
    docker push innovate/itframe:staging
fi
if [ ! -z "$TRAVIS_TAG" ]; then 
    docker tag innovate/itframe:latest innovate/itframe:$TRAVIS_TAG
    docker push innovate/itframe:$TRAVIS_TAG
fi