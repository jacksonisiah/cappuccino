const PostalMime = require('postal-mime');

import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";

async function streamToArrayBuffer(stream, streamSize) {
	let result = new Uint8Array(streamSize);
	let bytesRead = 0;
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		result.set(value, bytesRead);
		bytesRead += value.length;
	}
	return result;
}

export default {
    async email(message, env, ctx) {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 1.0,
      });


      switch (message.to) {
        case "admin@catfile.me":     // Admin contact
        case "copyright@catfile.me": // DMCA
        case "abuse@catfile.me":     // Abuse
        case "accounts@catfile.me":  // Shared accounts
        case "sys@catfile.me":       // System notices
            console.log("Email recieved from " + message.from + " to " + message.to + " with subject " + message.headers.get("subject"));
        
            const color = {
              "accounts@catfile.me": 1752220,
              "copyright@catfile.me": 15844367,
              "abuse@catfile.me": 15105570, 
              "admin@catfile.me": 10181046,
              "sys@catfile.me": 1752220
            }
            
            const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
            const parser = new PostalMime.default();
            const parsedEmail = await parser.parse(rawEmail);
            let attachments = ""
            if (parsedEmail.attachments.length == 0) {
                attachments = "No attachments"
            } else {
                parsedEmail.attachments.forEach(att => {
                    attachments += att.filename + ", "
                });
            }


            const payload = {
              embeds: [{
                "title": `Email recieved from ${message.from}: ${message.headers.get("subject")}`,
                "description": parsedEmail.text ? parsedEmail.text : parsedEmail.html, // Fallback when there is only HTML content in the email.
                "color": color[message.to],
                  fields: [
                        {
                        name: "Attachments",
                        value: attachments
                        },
                    ],
                "footer": {
                    "text": `Message sent to ${message.to}. This message is confidential and should not be shared.`
                }
              }]
            };
  
            await fetch(env.WEBHOOK_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            })
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
              }
              console.log("Webhook message sent successfully.");
            })
            .catch(error => {
              console.error("Error sending webhook message:", error);
            });
          await message.forward("jacksonisaiah@pm.me"); // fallback address
          break;
    
        // Anything else.
        default:
            await message.forward("jacksonisaiah@pm.me");
      }
    }
  }
  