import { test, expect } from "../support/fixtures";
import { trackApi } from "../support/network";

const EVENT_ID = "01JHP0CXJFR4MQS8SF1HQJCY38";

// Seeded in `backend/prisma/seeders/e2e`, all with the password "password".
const ROLES = {
  director: "john@example.com",
  coordinator: "coordinator@example.com",
  counselor: "counselor@example.com",
  viewer: "viewer@example.com",
  organizationAdmin: "organization-admin@example.com",
};

test.describe("permissions", () => {
  for (const [role, email] of Object.entries(ROLES)) {
    test(`${role} can open every event page it is offered`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium",
        "Permissions do not depend on the browser",
      );

      const api = trackApi(page);

      await page.goto("/login");
      const loginForm = page.getByTestId("login-form");
      await loginForm.getByTestId("email").fill(email);
      await loginForm.getByTestId("password").fill("password");
      await loginForm.getByTestId("submit").click();
      await expect(page).toHaveURL(/\/management\/events$/);

      // The event's own landing page, which every manager is sent to.
      await page.goto(`/management/events/${EVENT_ID}`);
      await expect(page).toHaveURL(/\/dashboard$/);

      const navigation = page.locator('a[data-test^="nav-"]');
      await expect(navigation.first()).toBeVisible();
      const paths = await navigation.evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      );
      expect(paths.length).toBeGreaterThan(0);

      for (const path of paths) {
        await test.step(path, async () => {
          await page.goto(path);
          await api.idle();
          await expect(page.getByTestId("page-error")).toHaveCount(0);
        });
      }

      expect(api.forbidden).toEqual([]);
    });
  }
});
