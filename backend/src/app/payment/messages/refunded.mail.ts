import type {
  Event,
  PaymentRefund,
  Registration,
} from '#generated/prisma/client.js';
import { RegistrationEventMessage } from '#app/registration/messages/event.mail';

export class PaymentRefundedMessage extends RegistrationEventMessage {
  static readonly trigger = 'payment_refunded';
  static readonly type = 'payment:template:refunded';

  static async enqueueForRefund(
    event: Event,
    registration: Registration,
    refund: Pick<PaymentRefund, 'amount' | 'reason'>,
  ): Promise<void> {
    const payloads = await this.payloadsFor(event, registration);

    await this.enqueueMany(
      payloads.map((payload) => ({
        ...payload,
        refund: { amount: refund.amount, reason: refund.reason },
      })),
    );
  }
}
