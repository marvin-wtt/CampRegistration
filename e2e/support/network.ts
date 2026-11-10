import type { Page, Request } from '@playwright/test';

// Realtime streams stay open for the page's lifetime, so Playwright's
// `networkidle` never settles while one is connected.
const isApiCall = (request: Request) => {
  const { pathname } = new URL(request.url());
  return pathname.startsWith('/api/') && !pathname.endsWith('/stream');
};

/**
 * Tracks the page's API calls. `idle()` resolves once none has been in flight
 * for `quietMs`, so follow-up fetches started by a response are waited for too.
 */
export function trackApi(page: Page, quietMs = 500) {
  const inFlight = new Set<Request>();
  let lastActivity = Date.now();
  let documentLoading = false;
  const forbidden: string[] = [];

  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      documentLoading = true;
    } else if (isApiCall(request)) {
      inFlight.add(request);
      lastActivity = Date.now();
    }
  });

  const settle = (request: Request) => {
    if (inFlight.delete(request)) {
      lastActivity = Date.now();
    }
  };
  page.on('requestfinished', settle);
  page.on('requestfailed', settle);

  // A new document aborts the old one's requests, sometimes without
  // `requestfailed` firing. SPA (pushState) navigations keep them.
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame() && documentLoading) {
      documentLoading = false;
      inFlight.clear();
    }
  });

  page.on('response', (response) => {
    if (isApiCall(response.request()) && response.status() === 403) {
      const { pathname } = new URL(response.url());
      forbidden.push(`${response.request().method()} ${pathname}`);
    }
  });

  // The quiet window restarts here, so the previous page's last call can't
  // count towards it.
  async function idle(): Promise<void> {
    lastActivity = Math.max(lastActivity, Date.now());
    while (inFlight.size > 0 || Date.now() - lastActivity < quietMs) {
      await page.waitForTimeout(100);
    }
  }

  return { idle, forbidden };
}
