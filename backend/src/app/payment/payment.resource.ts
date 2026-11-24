import type {
  Payment as PaymentData,
  PaymentRefund as PaymentRefundData,
  RegistrationFee,
} from '@camp-registration/common/entities';
import {
  paymentBalance,
  amountDueReductions,
  refundableAmount,
} from '@camp-registration/common/utils';
import type { PaymentRefund } from '#generated/prisma/client';
import { JsonResource } from '#core/resource/JsonResource';
import type {
  PaymentWithRefunds,
  RegistrationFeeData,
} from '#app/payment/payment.service';

export class PaymentResource extends JsonResource<
  PaymentWithRefunds,
  PaymentData
> {
  transform(): PaymentData {
    return {
      id: this.data.id,
      registrationId: this.data.registrationId,
      registrationRef: this.data.registrationRef,
      payerName: this.data.payerName,
      source: this.data.source,
      status: this.data.status,
      amount: this.data.amount,
      currency: this.data.currency,
      method: this.data.method,
      paidOn: this.data.paidOn,
      note: this.data.note,
      settlement: this.data.settlement,
      refunds: this.data.refunds.map(refundData),
      refundable: refundableAmount(this.data),
      createdByUserId: this.data.createdByUserId,
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}

/** The fixed projection the fees view reads; see `feeSelect`. */
export class RegistrationFeeResource extends JsonResource<
  RegistrationFeeData,
  RegistrationFee
> {
  transform(): RegistrationFee {
    const { registration, currency } = this.data;
    const emails = registration.emails ?? [];

    return {
      id: registration.id,
      reference: registration.paymentReference,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: emails[0] ?? null,
      status: registration.status,
      group: registration.group,
      createdAt: registration.createdAt.toISOString(),
      amountDue: {
        quotedAmount: registration.quotedAmount,
        override: registration.amountDueOverride,
        note: registration.amountDueNote,
        adjustedAt: registration.amountDueAdjustedAt?.toISOString() ?? null,
        reductions: amountDueReductions(registration.payments),
      },
      balance: paymentBalance(registration, currency, registration.payments),
      payments: PaymentResource.collection(registration.payments).transform(),
    };
  }
}

function refundData(refund: PaymentRefund): PaymentRefundData {
  return {
    id: refund.id,
    paymentId: refund.paymentId,
    status: refund.status,
    amount: refund.amount,
    refundedOn: refund.refundedOn,
    reason: refund.reason,
    amountDueReduction: refund.amountDueReduction,
    createdByUserId: refund.createdByUserId,
    createdAt: refund.createdAt.toISOString(),
  };
}
