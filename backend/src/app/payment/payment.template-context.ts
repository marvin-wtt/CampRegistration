import { formatMoney } from '@camp-registration/common/utils';
import { registerTemplateContext } from '#app/registration/messages/template-context';
import type { PaymentService } from './payment.service.js';
import { paymentPageUrl } from './payment-link.js';

/** What `PaymentRefundedMessage` passes along for the `refund.*` tokens. */
export interface RefundTemplateExtra {
  /** Minor units of the event currency. */
  amount: number;
  reason: string | null;
}

/**
 * The `payment.*` tokens — in every registration template, so a manager can
 * put the link into e.g. the confirmation mail too; hidden when nothing is
 * owed — and the `refund.*` tokens of the `payment_refunded` trigger.
 */
export function registerPaymentTemplateContexts(
  paymentService: PaymentService,
): void {
  registerTemplateContext(
    'payment',
    async ({ event, registration, locale }) => {
      if (!registration.amountDue) {
        return null;
      }
      const { outstanding } = await paymentService.getBalance(
        registration,
        event.currency,
      );

      return {
        amount: formatMoney(registration.amountDue, event.currency, locale),
        outstanding: formatMoney(outstanding, event.currency, locale),
        url: paymentPageUrl(event.id, registration.id),
      };
    },
  );

  registerTemplateContext('refund', ({ event, locale, extra }) => {
    const refund = extra.refund as RefundTemplateExtra | undefined;

    return refund
      ? {
          amount: formatMoney(refund.amount, event.currency, locale),
          reason: refund.reason,
        }
      : null;
  });
}
