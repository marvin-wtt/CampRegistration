import { test, expect } from '../support/fixtures';
import { waitForMessageBySentTo } from '../support/maildev';

// Seeded by backend/prisma/seeders/e2e/payment.seeder.ts: charges at
// registration, paid out through the fake provider.
const eventId = '01JHP0CXJFR4MQS8SF1HQJCPAY';

test.describe('payment', () => {
  const register = async (
    page: import('@playwright/test').Page,
    email: string,
  ) => {
    await page.goto(`/events/${eventId}/`);

    const registrationForm = page.getByTestId('registration-form');
    await registrationForm
      .locator('[data-name=first_name]')
      .locator('input')
      .fill('Pat');
    await registrationForm
      .locator('[data-name=email]')
      .locator('input')
      .fill(email);

    await registrationForm.locator('.sd-navigation__complete-btn').click();

    // Straight on to the provider's hosted checkout.
    await page.waitForURL(/\/webhooks\/payments\/fake\/checkout\//);
    await expect(page.getByTestId('fake-checkout-amount')).toHaveText(
      '€150.00',
    );
  };

  test('should pay at registration and return to a paid summary', async ({
    page,
  }) => {
    const email = 'payer@example.com';
    await register(page, email);

    await page.getByTestId('fake-checkout-paid').click();

    await page.waitForURL(
      new RegExp(`/events/${eventId}/registrations/[0-9A-Z]{26}/payment`),
    );
    const summary = page.getByTestId('registration-payment');
    await expect(summary).toHaveAttribute('data-test-status', 'PAID');
    await expect(page.getByTestId('registration-payment-pay')).toBeHidden();

    const receipt = await waitForMessageBySentTo(email);
    expect(receipt.subject).toBe('Payment received');
    expect(receipt.text).toContain('€150.00');
  });

  test('should offer to try again after a failed payment', async ({ page }) => {
    await register(page, 'retry@example.com');

    await page.getByTestId('fake-checkout-failed').click();

    await page.waitForURL(/\/payment\?/);
    const summary = page.getByTestId('registration-payment');
    await expect(summary).toHaveAttribute('data-test-status', 'UNPAID');

    await page.getByTestId('registration-payment-pay').click();
    await page.waitForURL(/\/webhooks\/payments\/fake\/checkout\//);
  });
});
