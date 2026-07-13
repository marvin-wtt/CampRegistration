import { test as base } from "@playwright/test";
import { seedE2eDatabase } from "./db";
import { deleteAllMessages } from "./maildev";

export const test = base.extend({
  page: async ({ page }, use) => {
    seedE2eDatabase();
    await deleteAllMessages();

    await use(page);
  },
});

export { expect } from "@playwright/test";
