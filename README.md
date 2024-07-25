[![Deploy](https://github.com/jacksonisiah/cappuccino/actions/workflows/main.yml/badge.svg)](https://github.com/jacksonisiah/cappuccino/actions/workflows/main.yml)

An email worker created to send notifications to a Discord channel because people are too lazy to check inboxes.

### requirements

- Nodejs
- Yarn
- Cloudflare email worker
- Make

### setting up

Set your Discord webhook `WEBHOOK_URL`, fallback email `FALLBACK_EMAIL`, and `SENTRY_DSN` in the Cloudflare Dashboard (Workers>Settings>Environment variables).

Change the destination and forwarding emails in `index.js` as well as any embed changes you may want to make.

Create a .env with your sentry org and project (as well as authenticate with sentry-cli) to enable Sentry.

Run `make` after configuring and authenticating with Cloudflare to start your worker.

### license

MIT
