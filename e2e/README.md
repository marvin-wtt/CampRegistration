# Camp Registration E2E

`@camp-registration/e2e` — end-to-end tests for the Camp Registration application,
powered by [Playwright](https://playwright.dev/).

## Technologies

- **Playwright** — end-to-end test runner, with desktop (Chromium, Firefox,
  WebKit) and mobile (Pixel 7, iPhone 14) device projects
- **MailDev REST API** (`support/maildev.ts`) — assert on emails captured by MailDev
- **otplib** — generate TOTP codes for 2FA flows
- **start-server-and-test** — boot the backend before running the suite

## Prerequisites

The tests run against a real backend and frontend build. Before running them:

1. Build all workspaces (from the repository root):

   ```bash
   npm run build
   ```

2. Start the supporting services (database and MailDev). The test profile uses a
   separate database on port 3307:

   ```bash
   docker-compose -f backend/docker-compose.yml --profile test up -d
   ```

The backend uses the `.env.e2e` configuration when run for end-to-end testing.

## Running the Tests

```bash
# Start the backend, then run the suite headlessly across all projects
npm run test --workspace e2e

# Open the interactive Playwright UI
npm run run:ui --workspace e2e

# Run a single project (e.g. mobile only)
npx playwright test --project=mobile-chrome --project=mobile-safari
```

## Conventions

- Prefer `data-test` attributes for selectors; use `page.getByTestId()`
  (configured to read `data-test` in `playwright.config.ts`).
- Use `support/maildev.ts` to assert on outgoing emails via MailDev's REST API.
- Use `otplib` (`support/totp.ts`) to generate TOTP codes when testing 2FA.
- Tests share a single MySQL database and truncate/reseed it per test
  (`support/fixtures.ts`), so the suite runs with `workers: 1` — don't
  parallelize without giving each worker its own database.

## License

Licensed under the [GNU Affero General Public License v3.0](../LICENSE)
(AGPL-3.0-only).
