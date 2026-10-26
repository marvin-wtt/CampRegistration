import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import {
  PAYMENT_EVENT_ID,
  PAYMENT_REGISTRATIONS,
  loginAsManager,
  openRegistrationPayments,
  paymentLink,
} from '../support/payments';

const { open, partial, overpaid } = PAYMENT_REGISTRATIONS;

const balance = (page: Page) => page.getByTestId('payment-balance');

function paymentPosted(page: Page, path: string) {
  return page.waitForResponse(
    (response) =>
      response.url().includes(path) && response.request().method() === 'POST',
  );
}

async function recordPayment(page: Page, amount?: string): Promise<void> {
  await page.getByTestId('payment-record').click();
  if (amount !== undefined) {
    await page.getByTestId('record-payment-amount').fill(amount);
  }
  const posted = paymentPosted(page, '/payments');
  await page.getByTestId('record-payment-save').click();
  expect((await posted).status()).toBe(201);
}

test.describe('payment management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test('should settle a balance with a payment recorded by hand', async ({
    page,
    isMobile,
  }) => {
    await openRegistrationPayments(page, open.name, isMobile);
    await expect(
      balance(page).getByTestId('payment-status-UNPAID'),
    ).toBeVisible();

    // Suggests what is open.
    await page.getByTestId('payment-record').click();
    await expect(page.getByTestId('record-payment-amount')).toHaveValue('150');
    await expect(page.getByTestId('record-payment-excess')).toBeHidden();
    await page.keyboard.press('Escape');

    await recordPayment(page);

    await expect(
      balance(page).getByTestId('payment-status-PAID'),
    ).toBeVisible();
    await expect(page.getByTestId('payment-overpaid')).toBeHidden();
  });

  test('should warn before recording more than is open', async ({
    page,
    isMobile,
  }) => {
    await openRegistrationPayments(page, partial.name, isMobile);
    await expect(
      balance(page).getByTestId('payment-status-PARTIAL'),
    ).toBeVisible();

    await page.getByTestId('payment-record').click();
    await page.getByTestId('record-payment-amount').fill('150');
    await expect(page.getByTestId('record-payment-excess')).toContainText(
      '€50.00',
    );
    // A warning, not a block.
    const posted = paymentPosted(page, '/payments');
    await page.getByTestId('record-payment-save').click();
    expect((await posted).status()).toBe(201);

    await expect(
      balance(page).getByTestId('payment-status-OVERPAID'),
    ).toBeVisible();
    await expect(page.getByTestId('payment-overpaid')).toBeVisible();
  });

  test('should refund an overpayment without lowering the amount due', async ({
    page,
    isMobile,
  }) => {
    await openRegistrationPayments(page, overpaid.name, isMobile);
    await expect(
      balance(page).getByTestId('payment-status-OVERPAID'),
    ).toBeVisible();

    await page.getByTestId('payment-refund-overpaid').click();
    await expect(page.getByTestId('refund-amount')).toHaveValue('150');
    await expect(page.getByTestId('refund-overpaid-hint')).toBeVisible();
    // Returning the excess has nothing to lower.
    await expect(page.getByTestId('refund-reduce-amount-due')).toBeHidden();

    const posted = paymentPosted(page, '/refunds');
    await page.getByTestId('refund-submit').click();
    const response = await posted;
    expect(response.status()).toBe(201);
    expect(response.request().postDataJSON()).toMatchObject({
      amount: 15000,
      reduceAmountDue: false,
    });

    await expect(
      balance(page).getByTestId('payment-status-PAID'),
    ).toBeVisible();
    await expect(balance(page)).toContainText('€150.00');
    await expect(page.getByTestId('payment-overpaid')).toBeHidden();
  });

  test('should lower the amount due only by a refund beyond the excess', async ({
    page,
    isMobile,
  }) => {
    await openRegistrationPayments(page, overpaid.name, isMobile);

    await page.getByTestId('payment-refund-overpaid').click();
    await page.getByTestId('refund-amount').fill('200');
    await expect(page.getByTestId('refund-reduce-amount-due')).toContainText(
      '€50.00',
    );
  });

  test('should list overpaid registrations under needs attention', async ({
    page,
  }) => {
    await page.goto(`/management/events/${PAYMENT_EVENT_ID}/dashboard`);

    const item = page.getByTestId('dashboard-attention-overpaid');
    await expect(item).toContainText('1');
    await item.click();

    await expect(page).toHaveURL(/[?&]template=payments-overpaid/);
    await expect(page.getByRole('row', { name: /Dan/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /Ben/ })).toBeHidden();
  });

  test('should list every payment in the ledger', async ({ page }) => {
    await page.goto(`/management/events/${PAYMENT_EVENT_ID}/payments`);

    // Ben €50, Cleo €150, Dan twice €150.
    await expect(page.getByTestId('ledger-total-received')).toContainText(
      '€500.00',
    );
    await expect(page.getByTestId('ledger-total-refunded')).toContainText(
      '€0.00',
    );
    await expect(
      page.getByTestId('ledger-table').locator('tbody tr'),
    ).toHaveCount(4);
  });
});

test.describe('stale checkouts', () => {
  test('should cancel an open checkout once the balance is paid by hand', async ({
    page,
    isMobile,
  }) => {
    // The participant starts paying online, then pays in cash instead.
    await page.goto(paymentLink(open.id));
    await page.getByTestId('registration-payment-pay').click();
    await page.waitForURL(/\/webhooks\/payments\/fake\/checkout\//);
    const checkoutUrl = page.url();
    await expect(page.getByTestId('fake-checkout-status')).toHaveText('OPEN');

    await loginAsManager(page);
    await openRegistrationPayments(page, open.name, isMobile);
    await recordPayment(page);

    // Paying the old checkout now would be paying twice.
    await page.goto(checkoutUrl);
    await expect(page.getByTestId('fake-checkout-status')).toHaveText(
      'CANCELED',
    );

    await page.goto(paymentLink(open.id));
    await expect(page.getByTestId('registration-payment')).toHaveAttribute(
      'data-test-status',
      'PAID',
    );
  });
});
