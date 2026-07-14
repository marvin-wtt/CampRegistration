import { test as base } from "@playwright/test";
import { seedE2eDatabase } from "./db";
import { deleteAllMessages } from "./maildev";

export const test = base.extend({
  page: async ({ page }, use) => {
    seedE2eDatabase();
    await deleteAllMessages();

    // helmet's default CSP sends `upgrade-insecure-requests`, which makes
    // the browser silently rewrite http:// requests to https://. Chromium
    // and Firefox tolerate that against localhost, but WebKit enforces it
    // strictly and fails with "SSL connect error" since the e2e server has
    // no TLS listener. The directive only takes effect via the top-level
    // document response, so only that request needs rewriting — routing
    // every request would re-fetch (and log) each one individually.
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") {
        return route.continue();
      }

      const response = await route.fetch();
      const headers = response.headers();
      delete headers["content-security-policy"];

      await route.fulfill({ response, headers });
    });

    await use(page);
  },
});

export { expect } from "@playwright/test";
