import { test, expect } from "../support/fixtures";

test.describe("smoke", () => {
  test("app should be available", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*/);
  });
});
