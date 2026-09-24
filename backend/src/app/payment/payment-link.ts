import { createHmac, timingSafeEqual } from 'node:crypto';
import config from '#config/index';
import { generateUrl } from '#utils/url';

// Domain-separates the derived key from any other use of JWT_SECRET.
const DERIVATION_LABEL = 'payment-link';

function linkKey(): string {
  return (
    config.payment.linkSecret ??
    createHmac('sha256', config.jwt.secret)
      .update(DERIVATION_LABEL)
      .digest('hex')
  );
}

/**
 * Stateless capability token for a registration's payment page: whoever
 * holds the link may see the balance and pay it, nothing else. It never
 * expires on its own — rotate `PAYMENT_LINK_SECRET` to revoke all links.
 */
export function signPaymentToken(registrationId: string): string {
  return createHmac('sha256', linkKey())
    .update(registrationId)
    .digest('base64url');
}

export function verifyPaymentToken(
  registrationId: string,
  token: string,
): boolean {
  const expected = Buffer.from(signPaymentToken(registrationId));
  const candidate = Buffer.from(token);

  return (
    expected.length === candidate.length && timingSafeEqual(expected, candidate)
  );
}

/**
 * The participant-facing payment page. As the provider's return URL it's
 * marked `returned`, so the page knows to wait for the payment to settle.
 */
export function paymentPageUrl(
  eventId: string,
  registrationId: string,
  options: { returned?: boolean } = {},
): string {
  return generateUrl(
    ['events', eventId, 'registrations', registrationId, 'payment'],
    {
      token: signPaymentToken(registrationId),
      ...(options.returned ? { returned: '1' } : {}),
    },
  );
}
