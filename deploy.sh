#!/bin/bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then 
    if [[ "$TRAVIS_BRANCH" == "master" ]]; then
      docker push innovate/itframe:latest 
    fi
    if [[ "$TRAVIS_BRANCH" == "staging" ]]; then
        docker tag innovate/itframe:latest innovate/itframe:staging
        docker push innovate/itframe:staging
    fi
    docker tag innovate/itframe:latest innovate/itframe:$TRAVIS_COMMIT
    docker push innovate/itframe:$TRAVIS_COMMIT
fi
if [ ! -z "$TRAVIS_TAG" ]; then 
    docker tag innovate/itframe:latest innovate/itframe:$TRAVIS_TAG
    docker push innovate/itframe:$TRAVIS_TAG
fi