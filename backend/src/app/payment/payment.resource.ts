import type { Payment as PaymentData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import type { PaymentWithDetails } from './payment.service.js';
import { refundedAmount } from './payment.balance.js';

export class PaymentResource extends JsonResource<
  PaymentWithDetails,
  PaymentData
> {
  transform(): PaymentData {
    const payment = this.data;

    return {
      id: payment.id,
      registrationId: payment.registrationId,
      source: payment.source as PaymentData['source'],
      status: payment.status,
      amount: payment.amount,
      amountRefunded: refundedAmount(payment),
      currency: payment.currency,
      method: payment.method,
      note: payment.note,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdBy: payment.createdBy?.name ?? null,
      createdAt: payment.createdAt.toISOString(),
      refunds: payment.refunds.map((refund) => ({
        id: refund.id,
        paymentId: refund.paymentId,
        status: refund.status,
        amount: refund.amount,
        reason: refund.reason,
        createdBy: refund.createdBy?.name ?? null,
        refundedAt: refund.refundedAt?.toISOString() ?? null,
        createdAt: refund.createdAt.toISOString(),
      })),
    };
  }
}
