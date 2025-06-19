import { defineConfig } from "cypress";
import { authenticator } from "otplib";
import * as smtpTester from "smtp-tester";

export default defineConfig({
  e2e: {
    projectId: "nk7wfe",
    baseUrl: "http://localhost:3001",

    setupNodeEvents(on, config) {
      const port = 456;
      const mailServer = smtpTester.init(port);
      let receivedEmails = [];

      mailServer.bind((addr, id, email) => {
        receivedEmails.push(email);
      });

      on("task", {
        // cypress cannot return undefined, thus we return null as a fallback

        generateTotp(secret: string): string {
          return authenticator.generate(secret);
        },

        clearEmails() {
          receivedEmails = [];
          return null;
        },

        getEmails(email: string) {
          return (
            receivedEmails.filter(
              (value) => value.headers.to.toLowerCase() === email.toLowerCase(),
            ) ?? null
          );
        },
      });

      return config;
    },
  },
});
