import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import { getAllMessages, waitForMessageBySentTo } from '../support/maildev';

// Seeded in backend/prisma/seeders/e2e: Germany and France, a strict address
// (the default) and a nationality question that only warns.
const GROUP_EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCG01';
const SINGLE_EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCY38';
// The same two groups, the French one full.
const WAITLIST_EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCW01';

const form = (page: Page) => page.getByTestId('registration-form');
const groupChoice = (page: Page) =>
  page.getByTestId('registration-group-select');

async function fillAnswers(page: Page, firstName = 'Tom') {
  const registrationForm = form(page);
  await registrationForm
    .locator('[data-name=first_name] input')
    .fill(firstName);
  const address = registrationForm.locator('[data-name=address]').first();
  await address.locator('[data-name=address] input').fill('Main Street 1');
  await address.locator('[data-name=zip_code] input').fill('12345');
  await address.locator('[data-name=city] input').fill('Sometown');
}

function registrationPosted(page: Page, eventId: string) {
  return page.waitForResponse(
    (response) =>
      response.url().includes(`/api/v1/events/${eventId}/registrations`) &&
      response.request().method() === 'POST',
  );
}

async function submit(page: Page, eventId: string) {
  const posted = registrationPosted(page, eventId);
  await form(page).locator('.sd-navigation__complete-btn').click();
  return posted;
}

test.describe('registration groups', () => {
  test('should register for the group chosen on the page', async ({ page }) => {
    await page.goto(`/events/${GROUP_EVENT_ID}`);

    await expect(form(page)).toBeHidden();
    await groupChoice(page).getByTestId('registration-group-fr').click();
    await expect(page).toHaveURL(/[?&]group=fr/);

    await fillAnswers(page);
    const response = await submit(page, GROUP_EVENT_ID);

    expect(response.status()).toBe(201);
    expect(response.request().postDataJSON()).toMatchObject({ group: 'fr' });
    const { data } = await response.json();
    expect(data).toHaveProperty('group', 'fr');
    expect(data.computedData.address).toMatchObject({
      street: 'Main Street 1',
      country: 'fr',
    });
    await expect(
      page.getByTestId('registration-submit-status-success'),
    ).toBeVisible();
  });

  test('should open the form directly for a group in the link', async ({
    page,
  }) => {
    await page.goto(`/events/${GROUP_EVENT_ID}?group=de`);

    await expect(groupChoice(page)).toBeHidden();
    await expect(form(page)).toBeVisible();
    await expect(page.getByTestId('registration-group')).toBeVisible();

    await fillAnswers(page);
    const response = await submit(page, GROUP_EVENT_ID);

    expect(response.status()).toBe(201);
    expect((await response.json()).data).toHaveProperty('group', 'de');
  });

  test('should return to the group choice on back', async ({ page }) => {
    await page.goto(`/events/${GROUP_EVENT_ID}`);
    await groupChoice(page).getByTestId('registration-group-fr').click();
    await expect(form(page)).toBeVisible();

    await page.goBack();

    await expect(groupChoice(page)).toBeVisible();
    await expect(form(page)).toBeHidden();
  });

  test("should lock a strict address country to the group's", async ({
    page,
  }) => {
    await page.goto(`/events/${GROUP_EVENT_ID}?group=fr`);

    const country = form(page)
      .locator('[data-name=address]')
      .first()
      .locator('[data-name=country]');
    await expect(country).toHaveClass(/sd-question--readonly/);
    await expect(country).toContainText('France');
  });

  test('should warn about another nationality without blocking', async ({
    page,
  }) => {
    await page.goto(`/events/${GROUP_EVENT_ID}?group=fr`);
    await fillAnswers(page);

    const nationality = form(page).locator('[data-name=nationality]');
    // Prefilled with the group's country, so its search starts with "France".
    await nationality.locator('.sd-dropdown').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Italy');
    await page.getByRole('option', { name: 'Italy', exact: true }).click();

    await expect(
      nationality.getByText(/differs from the group you are registering for/),
    ).toBeVisible();

    const response = await submit(page, GROUP_EVENT_ID);
    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data).toHaveProperty('group', 'fr');
    expect(data.data).toHaveProperty('nationality', 'it');
  });

  test('should reset the form when changing the group', async ({ page }) => {
    await page.goto(`/events/${GROUP_EVENT_ID}?group=fr`);
    await form(page).locator('[data-name=first_name] input').fill('Tom');

    await page.getByTestId('registration-group').click();
    await page.getByTestId('registration-group-change').click();
    await page.locator('[data-testid="submit"]').click();

    await expect(groupChoice(page)).toBeVisible();
    await groupChoice(page).getByTestId('registration-group-de').click();
    await expect(
      form(page).locator('[data-name=first_name] input'),
    ).toHaveValue('');
  });

  test.describe('register another person', () => {
    test('should ask for the group again on a multi-country event', async ({
      page,
    }) => {
      await page.goto(`/events/${GROUP_EVENT_ID}?group=fr`);
      await fillAnswers(page);
      expect((await submit(page, GROUP_EVENT_ID)).status()).toBe(201);

      await page.getByTestId('registration-register-another').click();

      await expect(groupChoice(page)).toBeVisible();
      await expect(page).not.toHaveURL(/group=/);
    });

    test('should start an empty form on a single-country event', async ({
      page,
    }) => {
      await page.goto(`/events/${SINGLE_EVENT_ID}`);
      const registrationForm = form(page);
      await registrationForm
        .locator('[data-name=first_name] input')
        .fill('Tom');
      await registrationForm
        .locator('[data-name=last_name] input')
        .fill('Smith');
      expect((await submit(page, SINGLE_EVENT_ID)).status()).toBe(201);

      await page.getByTestId('registration-register-another').click();

      await expect(registrationForm).toBeVisible();
      await expect(
        registrationForm.locator('[data-name=first_name] input'),
      ).toHaveValue('');
    });
  });

  test("should put a registration on the full group's waiting list and mail it", async ({
    page,
  }) => {
    const email = 'waitlist.tester@example.com';
    await page.goto(`/events/${WAITLIST_EVENT_ID}?group=fr`);
    const registrationForm = form(page);
    await registrationForm.locator('[data-name=first_name] input').fill('Tom');
    await registrationForm.locator('[data-name=email] input').fill(email);

    const response = await submit(page, WAITLIST_EVENT_ID);

    expect(response.status()).toBe(201);
    expect((await response.json()).data).toMatchObject({
      status: 'WAITLISTED',
      group: 'fr',
    });
    await expect(
      page.getByTestId('registration-submit-status-success'),
    ).toContainText(/waiting list/i);

    const message = await waitForMessageBySentTo(email);
    expect(message.subject).toBe('Waiting list France');
    expect(message.text).toContain('You are on the waiting list.');
    expect((await getAllMessages()).map((sent) => sent.subject)).not.toContain(
      'Confirmed France',
    );
  });

  test('should let a manager move a registration to the other group', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The row menu is part of the desktop table');

    await page.goto('/login');
    const loginForm = page.getByTestId('login-form');
    await loginForm.getByTestId('email').fill('john@example.com');
    await loginForm.getByTestId('password').fill('password');
    await loginForm.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/management\/events$/);

    await page.goto(`/management/events/${GROUP_EVENT_ID}/participants`);
    const row = page.getByRole('row', { name: /Lena/ });
    await row.getByRole('button').last().click();
    await page.getByTestId('registration-move').click();

    const dialog = page.getByRole('dialog');
    await dialog.getByText('France').click();
    const patched = page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(`/api/v1/events/${GROUP_EVENT_ID}/registrations/`) &&
        response.request().method() === 'PATCH',
    );
    await page.getByTestId('registration-move-submit').click();
    const response = await patched;

    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON()).toEqual({ group: 'fr' });
    const { data } = await response.json();
    expect(data).toMatchObject({ group: 'fr', status: 'ACCEPTED' });
    expect(data.computedData.address.country).toBe('de');
  });
});
