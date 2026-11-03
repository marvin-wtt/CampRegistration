import type { Page, Request } from "@playwright/test";

// Realtime streams stay open for the page's lifetime, so Playwright's
// `networkidle` never settles while one is connected.
const isApiCall = (request: Request) => {
  const { pathname } = new URL(request.url());
  return pathname.startsWith("/api/") && !pathname.endsWith("/stream");
};

/**
 * Tracks the page's API calls. `idle()` resolves once none has been in flight
 * for `quietMs`, so follow-up fetches started by a response are waited for too.
 */
export function trackApi(page: Page, quietMs = 500) {
  let inFlight = 0;
  let lastActivity = Date.now();
  const forbidden: string[] = [];

  page.on("request", (request) => {
    if (isApiCall(request)) {
      inFlight++;
      lastActivity = Date.now();
    }
  });

  const settle = (request: Request) => {
    if (isApiCall(request)) {
      inFlight--;
      lastActivity = Date.now();
    }
  };
  page.on("requestfinished", settle);
  page.on("requestfailed", settle);

  page.on("response", (response) => {
    if (isApiCall(response.request()) && response.status() === 403) {
      const { pathname } = new URL(response.url());
      forbidden.push(`${response.request().method()} ${pathname}`);
    }
  });

  async function idle(): Promise<void> {
    while (inFlight > 0 || Date.now() - lastActivity < quietMs) {
      await page.waitForTimeout(100);
    }
  }

  return { idle, forbidden };
}
