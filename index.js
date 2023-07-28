const PostalMime = require("postal-mime");
import { Toucan } from "toucan-js";
import { RewriteFrames } from "@sentry/integrations";

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
    const sentry = new Toucan({
      dsn: env.SENTRY_DSN,
      ctx,
      message,
      integrations: [new RewriteFrames({ root: "/" })],
    });

    switch (message.to) {
      case "admin@catfile.me": // admin
      case "sys@catfile.me": // System notices
        console.log(
          "Email recieved from " +
            message.from +
            " to " +
            message.to +
            " with subject " +
            message.headers.get("subject")
        );
        try {
          const color = {
            "admin@catfile.me": 10181046,
            "sys@catfile.me": 1752220,
          };

          const rawEmail = await streamToArrayBuffer(
            message.raw,
            message.rawSize
          );
          const parser = new PostalMime.default();
          const parsedEmail = await parser.parse(rawEmail);
          let attachments = "";
          if (parsedEmail.attachments.length == 0) {
            attachments = "No attachments";
          } else {
            parsedEmail.attachments.forEach((att) => {
              attachments += att.filename + ", ";
            });
          }

          const payload = {
            embeds: [
              {
                title: `Email recieved from ${
                  message.from
                }: ${message.headers.get("subject")}`,
                description: parsedEmail.text
                  ? parsedEmail.text
                  : parsedEmail.html, // Fallback when there is only HTML content in the email.
                color: color[message.to],
                fields: [
                  {
                    name: "Attachments",
                    value: attachments,
                  },
                ],
                footer: {
                  text: `Message sent to ${message.to}. This message is confidential and should not be shared.`,
                },
              },
            ],
          };

          await fetch(env.WEBHOOK_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
              }
              console.log("Webhook message sent successfully.");
            })
            .catch((error) => {
              console.error("Error sending webhook message:", error);
            });

          await message.forward("jacksonisaiah@pm.me"); // fallback address
        } catch (error) {
          sentry.captureException(error);
          console.error("Error sending webhook message:", error);
          await message.forward("jacksonisaiah@pm.me"); // fallback address
        }
        break;

      // Anything else.
      default:
        await message.forward("jacksonisaiah@pm.me");
    }
  },
};
