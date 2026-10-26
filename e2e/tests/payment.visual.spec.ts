import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import {
  PAYMENT_EVENT_ID,
  PAYMENT_REGISTRATIONS,
  loginAsManager,
  openRegistrationDetails,
  openRegistrationPayments,
  paymentLink,
} from '../support/payments';

// Visual coverage for the payment UI: the participant's payment page in each
// balance state, the payments tab of the registration details, the payment
// dialogs and the ledger. Every rendered value is fixed by the seed
// (backend/prisma/seeders/e2e/payment.seeder.ts). Chromium projects only, as
// in event-page.visual.spec.ts.

const { open, partial, paid, overpaid } = PAYMENT_REGISTRATIONS;

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

test.describe('payment — visual', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'visual snapshots are captured on Chromium-based projects only',
    );
  });

  test.describe('participant page', () => {
    for (const [state, registration] of Object.entries({
      unpaid: open,
      partial,
      paid,
      overpaid,
    })) {
      test(state, async ({ page }) => {
        await page.goto(paymentLink(registration.id));
        await expect(page.getByTestId('registration-payment')).toBeVisible();
        await settle(page);

        await expect(page).toHaveScreenshot(`payment-page-${state}.png`);
      });
    }
  });

  test.describe('management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsManager(page);
    });

    test('details — payment summary', async ({ page, isMobile }) => {
      await page.goto(`/management/events/${PAYMENT_EVENT_ID}/participants`);
      await openRegistrationDetails(page, partial.name, isMobile);
      const summary = page.getByTestId('registration-payment-summary');
      await summary.scrollIntoViewIfNeeded();
      await settle(page);

      await expect(summary).toHaveScreenshot('details-payment-summary.png');
    });

    for (const [state, registration] of Object.entries({
      unpaid: open,
      partial,
      overpaid,
    })) {
      test(`payments tab — ${state}`, async ({ page, isMobile }) => {
        await openRegistrationPayments(page, registration.name, isMobile);
        await settle(page);

        await expect(page).toHaveScreenshot(`payments-tab-${state}.png`);
      });
    }

    test('record payment — more than is open', async ({ page, isMobile }) => {
      await openRegistrationPayments(page, partial.name, isMobile);
      await page.getByTestId('payment-record').click();
      await page.getByTestId('record-payment-amount').fill('150');
      await expect(page.getByTestId('record-payment-excess')).toBeVisible();
      await settle(page);

      await expect(page).toHaveScreenshot('record-payment-excess.png');
    });

    test('refund — overpayment', async ({ page, isMobile }) => {
      await openRegistrationPayments(page, overpaid.name, isMobile);
      await page.getByTestId('payment-refund-overpaid').click();
      await expect(page.getByTestId('refund-overpaid-hint')).toBeVisible();
      await settle(page);

      await expect(page).toHaveScreenshot('refund-overpayment.png');
    });

    test('ledger', async ({ page }) => {
      await page.goto(`/management/events/${PAYMENT_EVENT_ID}/payments`);
      await expect(
        page.getByTestId('ledger-table').locator('tbody tr'),
      ).toHaveCount(4);
      await settle(page);

      await expect(page).toHaveScreenshot('ledger.png');
    });
  });
});
