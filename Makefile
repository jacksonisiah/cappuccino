.PHONY: publish sentry build

VERSION := $(shell date -u +"%Y.%m.%d").$(shell git rev-parse --short HEAD)

publish:
	yarn wrangler publish
	rm package-lock.json

sentry:
	yarn run build && \
	yarn sentry-cli releases new $(VERSION) && \
	yarn sentry-cli releases set-commits --auto $(VERSION) && \
	yarn sentry-cli releases files $(VERSION) upload-sourcemaps index.js
	yarn sentry-cli releases finalize $(VERSION)

build:
	yarn build
	rm package-lock.json
