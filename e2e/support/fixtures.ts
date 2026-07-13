import { test as base } from "@playwright/test";
import { truncateDatabase, seedDatabase } from "./db";
import { deleteAllMessages } from "./maildev";

export const test = base.extend({
  page: async ({ page }, use) => {
    truncateDatabase();
    seedDatabase();
    await deleteAllMessages();

    await use(page);
  },
});

export { expect } from "@playwright/test";
