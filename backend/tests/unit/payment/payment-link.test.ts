import { describe, expect, it } from 'vitest';
import {
  paymentPageUrl,
  signPaymentToken,
  verifyPaymentToken,
} from '#app/payment/payment-link';

describe('payment link tokens', () => {
  it('verifies a token for its own registration only', () => {
    const token = signPaymentToken('01J0000000000000000000000A');

    expect(verifyPaymentToken('01J0000000000000000000000A', token)).toBe(true);
    expect(verifyPaymentToken('01J0000000000000000000000B', token)).toBe(false);
  });

  it('rejects tampered or malformed tokens', () => {
    const token = signPaymentToken('01J0000000000000000000000A');

    expect(verifyPaymentToken('01J0000000000000000000000A', `${token}x`)).toBe(
      false,
    );
    expect(verifyPaymentToken('01J0000000000000000000000A', '')).toBe(false);
  });

  it('builds the participant payment page URL', () => {
    const url = new URL(paymentPageUrl('event-1', 'registration-1'));

    expect(url.pathname).toBe(
      '/events/event-1/registrations/registration-1/payment',
    );
    expect(url.searchParams.get('token')).toBe(
      signPaymentToken('registration-1'),
    );
  });
});
