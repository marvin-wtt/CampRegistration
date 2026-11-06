import type { RequestHandler } from 'express';
import logger from '#core/logger';
import { resolve } from '#core/ioc/container';
import { describeError } from '#utils/errors';
import { PaymentAccountService } from '#app/paymentAccount/payment-account.service';
import { PaymentReconciliationQueue } from './payment-reconciliation.queue.js';
import {
  InvalidWebhookError,
  type RawBodyRequest,
} from '#app/paymentAccount/providers/payment.provider';
import { PaymentReconciliationService } from './payment-reconciliation.service.js';

/**
 * `POST /webhooks/payments/:provider/:accountId`. The account id in the path
 * selects whose credentials verify the call (and, for Stripe, whose signing
 * secret); the body is only ever used to learn *which* payment changed. The
 * reconciliation itself is queued, so the provider is acknowledged at once. CSRF-exempt
 * via the `/webhooks/` prefix.
 */
export const paymentWebhookHandler: RequestHandler = async (req, res) => {
  const accountService = resolve(PaymentAccountService);
  const { provider, accountId } = req.params;

  const account =
    typeof accountId === 'string'
      ? await accountService.getById(accountId)
      : null;
  if (account?.provider !== provider) {
    res.sendStatus(404);
    return;
  }

  let providerPaymentId: string | null;
  try {
    const resolved = await accountService.resolve(account);
    providerPaymentId = await resolved.provider.parseWebhook(
      req as RawBodyRequest,
      resolved.credentials,
    );
  } catch (error) {
    if (error instanceof InvalidWebhookError) {
      res.sendStatus(400);
      return;
    }
    logger.error(
      `Payment webhook for account ${account.id} failed: ${describeError(error)}`,
    );
    res.sendStatus(500);
    return;
  }

  // Only payments we created are reconciled; anything else on the account (other
  // shops, dashboard-made payments) is acknowledged and ignored.
  const known =
    providerPaymentId !== null &&
    (await resolve(PaymentReconciliationService).isKnownProviderPayment(
      account.provider,
      providerPaymentId,
    ));

  if (known && providerPaymentId) {
    await resolve(PaymentReconciliationQueue).enqueue(
      account.provider,
      providerPaymentId,
    );
  }

  res.sendStatus(200);
};
