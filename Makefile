# Taken from: https://raw.githubusercontent.com/src-d/ci/v1/Makefile.main
# Package configuration
PROJECT = itframe
COMMANDS ?=
DEPENDENCIES ?=
TEST_RACE ?=

# Default shell
SHELL := /bin/bash

# Dockerfiles to be built, list of file:name pairs, example `Dockerfile:my-image`
DOCKERFILES = Dockerfile:$(PROJECT)
# Docker registry where the docker image should be pushed to.
DOCKER_REGISTRY ?= docker.io
# Docker organization to be used at the docker image name.
DOCKER_ORG = "innovate"
# Username used to login on the docker registry.
DOCKER_USERNAME ?=
# Password used to login on the docker registry.
DOCKER_PASSWORD ?=
# When `make docker-push`, setting DOCKER_PUSH_LATEST to any non-empty value
# will cause make docker-push to also push the latest tag.
DOCKER_PUSH_LATEST ?=
# When `make docker-push`, setting DOCKER_PUSH_MASTER to any non-empty value
# will cause make docker-push to also push when on the master branch.
DOCKER_PUSH_MASTER ?=
# Docker OS/Arch used to match the right binaries.
# If docker is not installed, fallback to GOOS/GOARCH.
ifneq ($(shell which docker),)
DOCKER_OS ?= $(shell docker version -f "{{.Server.Os}}")
DOCKER_ARCH ?= $(shell docker version -f "{{.Server.Arch}}")
else
DOCKER_OS ?= $(shell go env GOOS)
DOCKER_ARCH ?= $(shell go env GOARCH)
endif

# Backend services
POSTGRESQL_VERSION ?=
RABBITMQ_VERSION ?=

# Checking mandatory variables
ifndef PROJECT
$(error ERROR! The PROJECT variable cannot be empty)
endif

# Environment
BUILD_PATH := build
BIN_PATH := $(BUILD_PATH)/bin
BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD)
CI_PATH ?= .ci

# Build information
BUILD ?= $(shell date +"%m-%d-%Y_%H_%M_%S")
COMMIT ?= $(shell git rev-parse --short HEAD)
GIT_DIRTY = $(shell test -n "`git status --porcelain`" && echo "-dirty" || true)
DEV_PREFIX := dev
VERSION ?= $(DEV_PREFIX)-$(COMMIT)$(GIT_DIRTY)

# Travis CI
ifneq ($(TRAVIS_TAG), )
	VERSION := $(TRAVIS_TAG)
endif

# Drone CI
ifeq ($(DRONE_BUILD_EVENT), tag)
	VERSION := $(DRONE_TAG)
endif

# IS_RELEASE is "true" if tag is semantic version and not a pre-release
IS_RELEASE := $(shell echo $(VERSION) | grep -q -E '^v[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+$$' && echo "true" || true)

# Packages content
PKG_OS ?= darwin linux
PKG_ARCH = amd64

# LD_FLAGS to be use at `go build` calls.
LD_FLAGS ?= -X main.version=$(VERSION) -X main.build=$(BUILD) -X main.commit=$(COMMIT)
# Tags to be used as `-tags` argument at `go build` and `go install`
GO_TAGS ?=
# Arguments to be used in `go` commands.
GO_GET_ARGS ?= -v -t
GO_TEST_ARGS ?= -v
GO_BUILD_ARGS ?= -ldflags "$(LD_FLAGS)"
GOPROXY ?= https://proxy.golang.org
# Environment variable to use at `go build` calls.
GO_BUILD_ENV ?=

# Go parameters
ifneq ($(GO_TAGS), )
	GO_GET_ARGS += -tags "$(GO_TAGS)"
	GO_TEST_ARGS += -tags "$(GO_TAGS)"
	GO_BUILD_ARGS += -tags "$(GO_TAGS)"
endif

GOCMD = go
GOGET = GOPROXY=$(GOPROXY) $(GOCMD) get $(GO_GET_ARGS)
GOBUILD = GOPROXY=$(GOPROXY) $(GOCMD) build $(GO_BUILD_ARGS)
GOTEST = GOPROXY=$(GOPROXY) $(GOCMD) test $(GO_TEST_ARGS)
GOTEST_RACE = $(GOTEST) -race
GOCLEAN = $(GOCMD) clean

ifdef APPVEYOR
	GODEP := $(CI_PATH)/dep.exe
endif
GODEP ?= $(CI_PATH)/dep

# Coverage
COVERAGE_REPORT = coverage.txt
COVERAGE_PROFILE = profile.out
COVERAGE_MODE = atomic

PACKAGES = $(shell go list ./... | grep -v '/vendor/')

# Helm deployment information
HELM_VERSION ?= v2.14.1
HELM_DEPLOY_SCRIPT ?= https://raw.githubusercontent.com/innovate-technologies/itframe/master/helm-deploy.sh
HELM_RELEASE ?=
HELM_CHART ?=
K8S_NAMESPACE ?= default
K8S_SERVICE_ACCOUNT ?= default
HELM_ARGS ?=

# Python index update
PYTHON_INDEX_SIGNATURE ?= Infrastructure Team <infrastructure@sourced.tech>
PYTHON_INDEX_NAME ?= src-d/python-package-index

# Rules

.SUFFIXES:

dependencies: $(DEPENDENCIES)
	$(GOGET) -t ./...

$(DEPENDENCIES):
	$(GOGET) $@/...

test:
	$(GOTEST) $(PACKAGES)

test-race:
	if [ -z "$(TEST_RACE)" ]; then \
		echo -e "\033[0;31mWARNING! Testing with race detection is disabled, please consider toggling it on setting TEST_RACE ?= true"; \
	else \
		$(GOTEST_RACE) $(PACKAGES); \
	fi; \

test-coverage:
	echo "" > $(COVERAGE_REPORT); \
	for dir in $(PACKAGES); do \
		$(GOTEST) $$dir -coverprofile=$(COVERAGE_PROFILE) -covermode=$(COVERAGE_MODE); \
		if [ $$? != 0 ]; then \
			exit 2; \
		fi; \
		if [ -f $(COVERAGE_PROFILE) ]; then \
			cat $(COVERAGE_PROFILE) >> $(COVERAGE_REPORT); \
			rm $(COVERAGE_PROFILE); \
		fi; \
	done || exit 1; \

codecov:
	@if [ ! -f $(COVERAGE_REPORT) ]; then \
		echo "Unable to find '$(COVERAGE_REPORT)', execute 'make test-coverage' first."; \
		exit 1; \
	fi; \
	wget -q -O - https://codecov.io/bash | bash

build: $(COMMANDS)
$(COMMANDS):
	@if [ "$@" == "." ]; then \
		BIN=`basename $(CURDIR)` ; \
	else \
		BIN=`basename $@` ; \
	fi && \
	for os in $(PKG_OS); do \
		NBIN="$${BIN}" ; \
		if [ "$${os}" == windows ]; then \
			NBIN="$${NBIN}.exe"; \
		fi && \
		for arch in $(PKG_ARCH); do \
			mkdir -p $(BUILD_PATH)/$(PROJECT)_$${os}_$${arch} && \
			$(GO_BUILD_ENV) GOOS=$${os} GOARCH=$${arch} \
				$(GOBUILD) -o "$(BUILD_PATH)/$(PROJECT)_$${os}_$${arch}/$${NBIN}" ./$@ && \
			if [ "$(DOCKER_OS)" == "$${os}" ] && [ "$(DOCKER_ARCH)" == "$${arch}" ]; then \
				echo "Linking matching OS/Arch binaries to "build/bin" folder" && \
				mkdir -p $(BIN_PATH) && \
				cp -rf $(BUILD_PATH)/$(PROJECT)_$${os}_$${arch}/$${NBIN} $(BIN_PATH); \
			fi; \
		done; \
	done

docker-login: docker-validate
	@docker login -u "$(DOCKER_USERNAME)" -p "$(DOCKER_PASSWORD)" $(DOCKER_REGISTRY); \

docker-validate:
	@if [ -z "$(DOCKER_USERNAME)" ]; then \
		echo "DOCKER_USERNAME variable cannot be empty."; \
		exit 1; \
	fi; \
	if [ -z "$(DOCKER_PASSWORD)" ]; then \
		echo "DOCKER_PASSWORD variable cannot be empty."; \
		exit 1; \
	fi

docker-build: $(COMMANDS)
	@if [ -z "$(DOCKER_ORG)" ]; then \
		echo "DOCKER_ORG variable cannot be empty."; \
		exit 1; \
	fi; \
	for d in $(DOCKERFILES); do \
		dockerfile=`echo $${d} | cut -d":" -f 1`; \
		repository=`echo $${d} | cut -d":" -f 2`; \
		docker build --pull -t $(DOCKER_REGISTRY)/$(DOCKER_ORG)/$${repository}:$(VERSION) -f $$dockerfile .; \
	done;

docker-push: docker-login docker-build
	@if [ "$(BRANCH)" == "master" && "$(DOCKER_PUSH_MASTER)" == "" ]; then \
		echo "docker-push is disabled on master branch" \
		exit 1; \
	fi; \
	for d in $(DOCKERFILES); do \
		dockerfile=`echo $${d} | cut -d":" -f 1`; \
		repository=`echo $${d} | cut -d":" -f 2`; \
		docker push $(DOCKER_REGISTRY)/$(DOCKER_ORG)/$${repository}:$(VERSION); \
		if [ -n "$(DOCKER_PUSH_LATEST)" ]; then \
		 	docker tag $(DOCKER_REGISTRY)/$(DOCKER_ORG)/$${repository}:$(VERSION) \
				$(DOCKER_REGISTRY)/$(DOCKER_ORG)/$${repository}:latest; \
			docker push $(DOCKER_REGISTRY)/$(DOCKER_ORG)/$${repository}:latest; \
		fi; \
	done;

docker-push-latest-release:
	@DOCKER_PUSH_LATEST=$(IS_RELEASE) make docker-push

packages: build
	@cd $(BUILD_PATH); \
	for os in $(PKG_OS); do \
		for arch in $(PKG_ARCH); do \
			TAR_VERSION=`echo $(VERSION) | tr "/" "-"`; \
			tar -cvzf $(PROJECT)_$${TAR_VERSION}_$${os}_$${arch}.tar.gz $(PROJECT)_$${os}_$${arch}/; \
		done; \
	done

clean:
	rm -rf $(BUILD_PATH) $(BIN_PATH) $(VENDOR_PATH)
	$(GOCLEAN) .

no-changes-in-commit:
	@git status --untracked-files=normal --porcelain | grep -qe '..*'; \
	if  [ $$? -eq 0 ] ; then \
		git diff|cat; \
		git status --untracked-files=normal --porcelain; \
		echo >&2 "generated assets are out of sync"; \
		exit 2; \
	else \
		echo there is nothing pending to be commited; \
	fi

godep:
	export INSTALL_DIRECTORY=$(CI_PATH) ; \
	test -f $(GODEP) || \
		curl https://raw.githubusercontent.com/golang/dep/master/install.sh | bash ; \
	$(GODEP) ensure -v

export POSTGRESQL_VERSION RABBITMQ_VERSION
ifdef APPVEYOR
prepare-services:
	cd $(CI_PATH) && \
	pwsh -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/smola/ci-tricks/master/get.ps1'))"
else
prepare-services:
	cd $(CI_PATH) && \
	wget -qO - https://raw.githubusercontent.com/smola/ci-tricks/master/get.sh | bash
endif

ci-install: | prepare-services dependencies
	@echo

ifeq ($($strip $(COMMANDS)),)
ci-script: | test-coverage codecov test-race
	@echo
else
ci-script: | test-coverage codecov test-race packages
	@echo
endif

install-helm:
	GET_HELM=`mktemp` ; \
	trap "rm -f $${GET_HELM}" EXIT; \
	curl -L https://raw.githubusercontent.com/helm/helm/master/scripts/get > $${GET_HELM}; \
	chmod +x $${GET_HELM} ; \
	DESIRED_VERSION=$(HELM_VERSION) $${GET_HELM}

deploy: install-helm
	HELM_DEPLOY=`mktemp` ; \
	trap "rm -f $${HELM_DEPLOY}" EXIT; \
	curl -L $(HELM_DEPLOY_SCRIPT) > $${HELM_DEPLOY}; \
	chmod +x $${HELM_DEPLOY}; \
	$${HELM_DEPLOY} $(HELM_RELEASE) $(HELM_CHART) $(K8S_NAMESPACE) $(K8S_SERVICE_ACCOUNT) $(HELM_ARGS)

install-python-indexer:
	pip3 install --user pypi-on-github-indexer

update-python-index: install-python-indexer
	@if [ -n "$(TRAVIS_TAG)" ]; then \
		python3 -m pypi_on_github_indexer --signature "$(PYTHON_INDEX_SIGNATURE)" \
						  --github-token "$(GITHUB_TOKEN)" \
						  --index-name "$(PYTHON_INDEX_NAME)" \
						  --repo-url "https://github.com/$(TRAVIS_SLUG)" \
						  --repo-tag "$(TRAVIS_TAG)"; \
	else \
		echo "This action is only currently supported while tagging in Travis CI"; \
		exit 1; \
	fi

.PHONY: dependencies $(DEPENDENCIES) \
		build $(COMMANDS) \
		test test-race test-coverage \
		docker-login docker-validate docker-build docker-push \
		packages \
		clean \
		no-changes-in-commit \
		prepare-services \
		ci-script ci-install \
		update-python-index \
		install-python-indexer \
		install-helm deploy
