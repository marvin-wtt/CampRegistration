import type { RequestHandler } from 'express';
import { formatMoney } from '@camp-registration/common/utils';
import {
  completeFakePayment,
  getFakePayment,
} from './providers/fake/fake.provider.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const OUTCOMES = {
  paid: 'PAID',
  failed: 'FAILED',
  cancel: 'CANCELED',
} as const;

/**
 * The fake provider's hosted checkout page — plain links rather than a form,
 * so no script or form-action CSP gets in the way. Only mounted when
 * `PAYMENT_FAKE_PROVIDER` is on.
 */
export const fakeCheckoutPage: RequestHandler = (req, res) => {
  const payment = getFakePayment(String(req.params.paymentId));
  if (!payment) {
    res.sendStatus(404);
    return;
  }

  const link = (outcome: keyof typeof OUTCOMES, label: string) =>
    `<a data-test="fake-checkout-${outcome}" href="${escapeHtml(payment.id)}/complete?outcome=${outcome}">${label}</a>`;

  res.type('html').send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Fake checkout</title></head>
<body>
  <h1>Fake checkout</h1>
  <p>${escapeHtml(payment.description)}</p>
  <p data-test="fake-checkout-amount">${escapeHtml(formatMoney(payment.amount, payment.currency, 'en-US'))}</p>
  <p>Status: ${payment.status}</p>
  <p>${link('paid', 'Pay')} · ${link('failed', 'Fail')} · ${link('cancel', 'Cancel')}</p>
</body>
</html>`);
};

export const fakeCheckoutComplete: RequestHandler = async (req, res) => {
  const requested = req.query.outcome;
  const outcome =
    typeof requested === 'string' && requested in OUTCOMES
      ? OUTCOMES[requested as keyof typeof OUTCOMES]
      : 'PAID';
  const payment = await completeFakePayment(
    String(req.params.paymentId),
    outcome,
  );
  if (!payment) {
    res.sendStatus(404);
    return;
  }

  res.redirect(303, payment.returnUrl);
};
