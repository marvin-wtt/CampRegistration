import { defineConfig } from "cypress";
import * as authenticator from "otplib";

export default defineConfig({
  e2e: {
    projectId: "nk7wfe",
    baseUrl: "http://localhost:3001",

    env: {
      MAILDEV_PROTOCOL: "http",
      MAILDEV_HOST: "localhost",
      MAILDEV_SMTP_PORT: "1026",
      MAILDEV_API_PORT: "1081",
    },

    setupNodeEvents(on, config) {
      on("task", {
        // cypress cannot return undefined, thus we return null as a fallback

        generateTotp(secret: string): Promise<string> {
          return authenticator.generate({
            secret,
          });
        },
      });

      return config;
    },
  },
});
