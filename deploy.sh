#!/bin/bash
if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then 
    docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
    docker push innovate/itframe:latest
    docker tag innovate/itframe:latest innovate/itframe:$TRAVIS_COMMIT
    docker push innovate/itframe:$TRAVIS_COMMIT
fi
if [ ! -z "$TRAVIS_TAG" ]; then 
    docker tag innovate/itframe:latest innovate/itframe:$TRAVIS_TAG
    docker push innovate/itframe:$TRAVIS_TAG
fi