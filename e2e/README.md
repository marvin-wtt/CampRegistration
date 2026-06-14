# Camp Registration E2E

`@camp-registration/e2e` — end-to-end tests for the Camp Registration application,
powered by [Cypress](https://www.cypress.io/).

## Technologies

- **Cypress** — end-to-end test runner
- **cypress-maildev** — assert on emails captured by MailDev
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
# Start the backend, then run the suite headlessly
npm run test --workspace e2e

# Open the interactive Cypress UI
npm run run:ui --workspace e2e
```

## Conventions

- Prefer `data-cy` attributes for selectors.
- Use `cypress-maildev` to assert on outgoing emails.
- Use `otplib` to generate TOTP codes when testing 2FA.

## License

Licensed under the [GNU Affero General Public License v3.0](../LICENSE)
(AGPL-3.0-only).
