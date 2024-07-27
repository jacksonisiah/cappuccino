import PostalMime from "postal-mime";
import { Toucan } from "toucan-js";
import { RewriteFrames } from "@sentry/integrations";

export default {
  async email(message, env, ctx) {
    const sentry = new Toucan({
      dsn: env.SENTRY_DSN,
      ctx,
      message,
      integrations: [new RewriteFrames({ root: "/" })],
    });

    if (message.from == env.FALLBACK_EMAIL) {
      console.warn(
        "Received email that may cause a potential infinite loopback",
      );
      return;
    }

    // todo: wildcard any email contained in a env list?
    switch (message.to) {
      case "admin@catfile.me": // admin
      case "sys@catfile.me": // System notices
        console.log(
          "Email recieved from " +
            message.from +
            " to " +
            message.to +
            " with subject " +
            message.headers.get("subject"),
        );
        try {
          const color = {
            "admin@catfile.me": 10181046,
            "sys@catfile.me": 1752220,
          };

          const parsedEmail = await PostalMime.parse(message.raw);

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
                throw new Error(`HTTP error ${response.status}`); // this should catch invalid webhooks
              }
              console.log("Webhook message sent successfully.");
            })
            .catch((error) => {
              console.error("Error sending webhook message:", error);
            });

          await message.forward(env.FALLBACK_EMAIL); // fallback address
        } catch (error) {
          sentry.captureException(error);
          console.error("Error sending webhook message:", error);
          await message.forward(env.FALLBACK_EMAIL); // fallback address
        }
        break;

      // Anything else.
      default:
        await message.forward(env.FALLBACK_EMAIL);
    }
  },
};
