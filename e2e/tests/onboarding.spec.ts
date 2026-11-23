import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';

const EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCY38';
// The seeded event's dates are random; previewing a phase pins the layout.
const DASHBOARD = `/management/events/${EVENT_ID}/dashboard?phase=setup`;

async function login(page: Page, email: string) {
  await page.goto('/login');
  const loginForm = page.getByTestId('login-form');
  await loginForm.getByTestId('email').fill(email);
  await loginForm.getByTestId('password').fill('password');
  await loginForm.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/management\/events$/);
}

async function logout(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

test.describe('onboarding checklist', () => {
  test('keeps checked and skipped items for the whole team', async ({
    page,
  }) => {
    await login(page, 'john@example.com');
    await page.goto(DASHBOARD);

    const form = page.getByTestId('dashboard-onboarding-form');
    const privacy = page.getByTestId('dashboard-onboarding-privacy');
    await expect(form).toHaveAttribute('data-status', 'open');

    const saved = () =>
      page.waitForResponse(
        (response) =>
          response.url().includes('/settings/onboarding') &&
          response.request().method() === 'PUT' &&
          response.ok(),
      );

    let save = saved();
    await page.getByTestId('dashboard-onboarding-form-check').click();
    await save;

    save = saved();
    await page.getByTestId('dashboard-onboarding-privacy-menu').click();
    await page.getByTestId('dashboard-onboarding-privacy-skip').click();
    await save;

    // Finished items leave the list until it's asked for.
    await expect(form).toHaveCount(0);
    await expect(privacy).toHaveCount(0);

    const expectFinished = async () => {
      await page.getByTestId('dashboard-onboarding-more').click();
      await expect(form).toHaveAttribute('data-status', 'done');
      await expect(privacy).toHaveAttribute('data-status', 'skipped');
    };

    await page.reload();
    await expectFinished();

    await logout(page);
    await login(page, 'coordinator@example.com');
    await page.goto(DASHBOARD);
    await expectFinished();
  });
});
