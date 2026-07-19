import { test, expect } from "../support/fixtures";
import type { Page } from "@playwright/test";

// Visual regression coverage for the public camp page. It guards the layout of
// every registration status the page can render — including the width of the
// survey container, which silently regressed in production once before.
//
// Screenshot comparisons are inherently rendering-engine specific. To keep the
// baselines deterministic and maintainable we run this suite on the two
// Chromium-based projects only (desktop `chromium` + `mobile-chrome`), which
// still covers both the desktop and the responsive/mobile layout.

// Camps from the e2e seed, each in a fixed registration status.
const OPEN_CAMP = "01JHP0CXJFR4MQS8SF1HQJCY38"; // no window -> open
const UPCOMING_CAMP = "01JHP0CXJFR4MQS8SF1HQJCA10"; // opens in 2999 -> upcoming
const CLOSED_CAMP = "01JHP0CXJFR4MQS8SF1HQJCA20"; // closed in 2020 -> closed
// A well-formed but unseeded id -> 404 -> "not found".
const MISSING_CAMP = "01JHP0CXJFR4MQS8SF1HQJCY30";

/** Wait for the page to reach a stable state before capturing a screenshot. */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

test.describe("camp page — visual", () => {
  // Snapshots are captured on Chromium engines only; skip the WebKit/Firefox
  // projects to avoid cross-engine rendering noise in the baselines.
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName !== "chromium",
      "visual snapshots are captured on Chromium-based projects only",
    );
  });

  test("registration open — survey spans the full container width", async ({
    page,
  }) => {
    await page.goto(`/camps/${OPEN_CAMP}/`);

    const form = page.getByTestId("registration-form");
    await expect(
      form.locator("[data-name=first_name]").locator("input"),
    ).toBeVisible();
    await expect(
      form.locator("[data-name=last_name]").locator("input"),
    ).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot("camp-page-open.png", {
      fullPage: true,
    });
  });

  test("registration upcoming", async ({ page }) => {
    await page.goto(`/camps/${UPCOMING_CAMP}/`);

    await expect(
      page.getByTestId("camp-registration-status-upcoming"),
    ).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot("camp-page-upcoming.png");
  });

  test("registration closed", async ({ page }) => {
    await page.goto(`/camps/${CLOSED_CAMP}/`);

    await expect(
      page.getByTestId("camp-registration-status-closed"),
    ).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot("camp-page-closed.png");
  });

  test("registration not found", async ({ page }) => {
    await page.goto(`/camps/${MISSING_CAMP}/`);

    await expect(
      page.getByTestId("camp-registration-status-not_found"),
    ).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot("camp-page-not-found.png");
  });

  test("submit — saving overlay", async ({ page }) => {
    // Hold the create-registration request open so the transient "saving"
    // overlay stays on screen long enough to capture.
    let releaseSubmit: () => void = () => {};
    const submitGate = new Promise<void>((resolve) => {
      releaseSubmit = resolve;
    });

    await page.route(
      (url) =>
        url.pathname.includes(`/camps/${OPEN_CAMP}/registrations`) &&
        !url.pathname.includes("/files"),
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }

        await submitGate;
        await route.fallback();
      },
    );

    await page.goto(`/camps/${OPEN_CAMP}/`);
    await fillAndSubmit(page);

    await expect(
      page.getByTestId("registration-submit-status-saving"),
    ).toBeVisible();
    // Do not wait for network idle here: the create request is intentionally
    // held open, so the network never goes idle. Fonts are already loaded from
    // the initial page render.
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot("camp-page-submit-saving.png");

    // Let the request complete so the test tears down cleanly.
    releaseSubmit();
  });

  test("submit — success overlay", async ({ page }) => {
    await page.goto(`/camps/${OPEN_CAMP}/`);
    await fillAndSubmit(page);

    await expect(
      page.getByTestId("registration-submit-status-success"),
    ).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot("camp-page-submit-success.png");
  });

  test("submit — error overlay", async ({ page }) => {
    await page.route(
      (url) =>
        url.pathname.includes(`/camps/${OPEN_CAMP}/registrations`) &&
        !url.pathname.includes("/files"),
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }

        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: 500,
            message: "Internal Server Error",
          }),
        });
      },
    );

    await page.goto(`/camps/${OPEN_CAMP}/`);
    await fillAndSubmit(page);

    await expect(
      page.getByTestId("registration-submit-status-error"),
    ).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot("camp-page-submit-error.png");
  });
});

/** Fill the required fields of the "Simple Camp" form and submit it. */
async function fillAndSubmit(page: Page): Promise<void> {
  const form = page.getByTestId("registration-form");
  await form.locator("[data-name=first_name]").locator("input").fill("Tom");
  await form.locator("[data-name=last_name]").locator("input").fill("Smith");
  await form.locator(".sd-navigation__complete-btn").click();
}
