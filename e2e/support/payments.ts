import { createHmac } from 'node:crypto';
import type { Page } from '@playwright/test';

// Seeded by backend/prisma/seeders/e2e/payment.seeder.ts.
export const PAYMENT_EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCPAY';

/** One accepted registration per balance state, each owing €150.00. */
export const PAYMENT_REGISTRATIONS = {
  // Nothing paid.
  open: { id: '01JHP0CXJFR4MQS8SF1HQJCPR1', name: 'Ava' },
  // €50.00 in cash.
  partial: { id: '01JHP0CXJFR4MQS8SF1HQJCPR2', name: 'Ben' },
  // €150.00 by bank transfer.
  paid: { id: '01JHP0CXJFR4MQS8SF1HQJCPR3', name: 'Cleo' },
  // €150.00 in cash and again by bank transfer.
  overpaid: { id: '01JHP0CXJFR4MQS8SF1HQJCPR4', name: 'Dan' },
} as const;

/**
 * The participant's payment link, signed like `payment-link.ts` does. The
 * Playwright config loads `backend/.env.e2e`, so both sides share the secret.
 */
export function paymentLink(registrationId: string): string {
  const key =
    process.env.PAYMENT_LINK_SECRET ??
    createHmac('sha256', process.env.JWT_SECRET ?? '')
      .update('payment-link')
      .digest('hex');
  const token = createHmac('sha256', key)
    .update(registrationId)
    .digest('base64url');

  return `/events/${PAYMENT_EVENT_ID}/registrations/${registrationId}/payment?token=${token}`;
}

export async function loginAsManager(page: Page): Promise<void> {
  await page.goto('/login');
  const loginForm = page.getByTestId('login-form');
  await loginForm.getByTestId('email').fill('john@example.com');
  await loginForm.getByTestId('password').fill('password');
  await loginForm.getByTestId('submit').click();
  await page.waitForURL(/\/management\/events$/);
}

/**
 * Opens a registration's details from the participants table: the row menu
 * on desktop, the row's card on phones.
 */
export async function openRegistrationDetails(
  page: Page,
  name: string,
  isMobile: boolean,
): Promise<void> {
  const row = page.getByRole('row', { name: new RegExp(name) });
  if (isMobile) {
    await row.click();
    await page.getByTestId('registration-card-actions').click();
  } else {
    await row.getByTestId('registration-row-actions').click();
  }
  await page.getByTestId('registration-details').click();
}

/** The participants table, then a registration's payments tab. */
export async function openRegistrationPayments(
  page: Page,
  name: string,
  isMobile: boolean,
): Promise<void> {
  await page.goto(`/management/events/${PAYMENT_EVENT_ID}/participants`);
  await openRegistrationDetails(page, name, isMobile);
  await page.getByTestId('registration-tab-payments').click();
  await page.getByTestId('payment-balance').waitFor();
}
