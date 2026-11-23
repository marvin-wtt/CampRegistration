import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';

// Seeded in `backend/prisma/seeders/e2e`, all with the password "password".
const NO_ORGANIZATION_USER = 'coordinator@example.com';
const ORGANIZATION_ADMIN = 'organization-admin@example.com';
const ORGANIZATION_ID = '01JHP0CXJFR4MQS8SF1HQJ8RGZ';

async function login(page: Page, email: string) {
  // The two-factor suggestion would cover the page right after login.
  await page.addInitScript(() =>
    localStorage.setItem('two-factor-suggestion-dismissed', 'true'),
  );
  await page.goto('/login');
  const loginForm = page.getByTestId('login-form');
  await loginForm.getByTestId('email').fill(email);
  await loginForm.getByTestId('password').fill('password');
  await loginForm.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/management\/events$/);
}

test.describe('first event', () => {
  test('founds an organization on the way to the event dialog', async ({
    page,
  }) => {
    await login(page, NO_ORGANIZATION_USER);

    await page.getByTestId('event-create').click();
    const required = page.getByTestId('event-organization-required');
    await expect(required).toContainText(NO_ORGANIZATION_USER);
    await required.getByTestId('event-organization-required-create').click();

    await page.getByTestId('organization-name').fill('New Organization');
    await page
      .getByTestId('organization-contactEmail')
      .fill('new-org@example.com');
    await page.getByTestId('organization-addressStreet').fill('Main Street 1');
    await page.getByTestId('organization-addressZipCode').fill('10115');
    await page.getByTestId('organization-addressCity').fill('Berlin');
    // The test id lands on the select's inner input, which stays hidden on
    // phones (the select opens as a dialog there) — click the field instead.
    await page
      .getByTestId('organization-country')
      .locator('xpath=ancestor::label[1]')
      .click();
    await page.keyboard.type('Germany');
    await page.getByRole('option', { name: 'Germany', exact: true }).click();
    await page.getByTestId('organization-submit').click();

    await expect(page.getByTestId('event-organization')).toHaveValue(
      'New Organization',
    );
  });

  test('preselects the organization from its dashboard', async ({ page }) => {
    await login(page, ORGANIZATION_ADMIN);

    await page.goto(`/management/organizations/${ORGANIZATION_ID}`);
    await page.getByTestId('organization-create-event').click();

    await expect(page.getByTestId('event-organization')).toHaveValue(
      'Verified Organization',
    );
  });

  test('preselects the organization from its events page', async ({ page }) => {
    await login(page, ORGANIZATION_ADMIN);

    await page.goto(`/management/organizations/${ORGANIZATION_ID}/events`);
    await page.getByTestId('organization-events-create').click();

    await expect(page.getByTestId('event-organization')).toHaveValue(
      'Verified Organization',
    );
  });
});
