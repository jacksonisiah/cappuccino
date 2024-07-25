.PHONY: build publish sentry_release

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

VERSION := $(shell date -u +"%Y.%m.%d").$(shell git rev-parse --short HEAD)

publish:
	yarn wrangler deploy
	rm package-lock.json

sentry_release:
	yarn sentry-cli releases new $(VERSION)
	yarn sentry-cli sourcemaps inject .
	yarn sentry-cli sourcemaps upload --release=$(VERSION) .
	yarn sentry-cli releases finalize $(VERSION)

build:
	yarn build
	rm package-lock.json
