### Cappuccino - Cloudflare workers email processor [![Deploy](https://github.com/jacksonisiah/cappuccino/actions/workflows/main.yml/badge.svg)](https://github.com/jacksonisiah/cappuccino/actions/workflows/main.yml)

An email worker created to send notifications to a Discord channel because people are too lazy to check inboxes.

### Requirements

- Nodejs
- Yarn
- Cloudflare email worker

### Configuration

Set your Discord webhook in the Cloudflare Dashboard (Environment variables) for messages to be delivered to.

Change the destination and forwarding emails in `index.js` as well as any embed changes you may want to make.

### Deploying 

Run `wrangler publish` after configuring and authenticating with Cloudflare to start your worker.

### License

MIT
