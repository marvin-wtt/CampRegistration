import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import {
  type Payment,
  type PaymentRefund,
  Prisma,
} from '#generated/prisma/client.js';
import {
  overpaidAmount,
  refundableAmount,
  registrationPayment,
} from '@camp-registration/common/utils';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import { describeError } from '#utils/errors';
import { AuditService } from '#app/audit/audit.service';
import {
  PaymentAccountService,
  type ResolvedPaymentAccount,
} from '#app/paymentAccount/payment-account.service';
import { paymentAuditEntry } from './payment.audit.js';
import {
  balanceSelect,
  paymentInclude,
  type PaymentWithDetails,
} from './payment.service.js';

// Serializable refund bookings conflict when two run at once; neither has
// side effects outside the database, so they are simply run again.
const CONFLICT_RETRIES = 3;

export interface RefundData {
  /** Minor units. */
  amount: number;
  reason: string | null;
  notifyParticipant: boolean;
  outsideApp: boolean;
  reduceAmountDue: boolean;
}

export interface RefundResult {
  refund: PaymentRefund;
  payment: PaymentWithDetails;
  /** Whether this call moved the refund to `REFUNDED` (so it alone notifies). */
  completedNow: boolean;
}

/**
 * Money going back: booking a refund against what was paid, handing it to
 * the provider, and keeping the amount due in step when one fails.
 */
@injectable()
export class PaymentRefundService extends BaseService {
  constructor(
    @inject(PaymentAccountService)
    private readonly accountService: PaymentAccountService,
    @inject(AuditService) private readonly audit: AuditService,
  ) {
    super();
  }

  /**
   * Gives money back. The limit check and the PENDING row are one
   * serializable transaction, so concurrent refunds can never exceed what
   * was paid; the provider is called only after it committed, and the
   * refund is audited only once the provider took it. A manual payment's
   * refund, or one given back outside the app, is recorded as already done.
   */
  async refund(
    payment: Payment,
    data: RefundData,
    userId: string,
  ): Promise<RefundResult> {
    let resolved: ResolvedPaymentAccount | null = null;
    if (payment.source !== 'manual' && !data.outsideApp) {
      // Through the account it was paid with, even if since replaced.
      resolved = await this.accountService.resolveForPayment(payment);
      if (!resolved || !payment.providerPaymentId) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'This payment has no provider account to refund it through. Refund it outside the app and record that manually.',
          { code: 'PAYMENT_ACCOUNT_CHANGED' },
        );
      }
    }

    const refund = await this.book(payment.id, data, userId);
    let completedNow = refund.status === 'REFUNDED';

    if (resolved && payment.providerPaymentId) {
      completedNow = await this.submit(
        resolved,
        payment.providerPaymentId,
        payment.currency,
        refund,
        data.reason,
      );
    }

    const stored = await this.prisma.paymentRefund.findUniqueOrThrow({
      where: { id: refund.id },
    });
    if (stored.status === 'PENDING' || stored.status === 'REFUNDED') {
      await this.recordRefund(stored);
    }

    return {
      refund: stored,
      payment: await this.prisma.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: paymentInclude,
      }),
      completedNow,
    };
  }

  /** The refund row, checked against what the payment can still give back. */
  private async book(
    paymentId: string,
    data: RefundData,
    userId: string,
  ): Promise<PaymentRefund> {
    return this.transaction(
      async (tx) => {
        const current = await tx.payment.findUniqueOrThrow({
          where: { id: paymentId },
          include: { refunds: true },
        });

        if (current.status !== 'PAID') {
          throw new ApiError(
            httpStatus.CONFLICT,
            'Only paid payments can be refunded',
          );
        }
        if (data.amount > refundableAmount(current)) {
          throw new ApiError(
            httpStatus.UNPROCESSABLE_ENTITY,
            'The refund exceeds the refundable amount',
            { code: 'PAYMENT_REFUND_EXCEEDS' },
          );
        }

        // Nothing to wait for: no provider takes part.
        const manual = current.source === 'manual' || data.outsideApp;

        const created = await tx.paymentRefund.create({
          data: {
            paymentId: current.id,
            amount: data.amount,
            reason: data.reason,
            notifyParticipant: data.notifyParticipant,
            createdById: userId,
            status: manual ? 'REFUNDED' : 'PENDING',
            refundedAt: manual ? new Date() : null,
          },
        });
        const reduction =
          current.registrationId && data.reduceAmountDue
            ? await this.reduceAmountDue(
                tx,
                current.registrationId,
                data.amount,
                data.reason,
              )
            : 0;

        return reduction > 0
          ? tx.paymentRefund.update({
              where: { id: created.id },
              data: { amountDueReduction: reduction },
            })
          : created;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        retries: CONFLICT_RETRIES,
      },
    );
  }

  /**
   * Hands a booked refund to the provider. A webhook may race ahead and
   * settle it: the conditional update only moves a still-pending refund
   * forward, so exactly one of the two paths records (and notifies)
   * completion. Returns whether this call completed it.
   */
  private async submit(
    { provider, credentials }: ResolvedPaymentAccount,
    providerPaymentId: string,
    currency: string,
    refund: PaymentRefund,
    reason: string | null,
  ): Promise<boolean> {
    try {
      const result = await provider.createRefund(
        credentials,
        providerPaymentId,
        { amount: refund.amount, currency, reason, reference: refund.id },
      );

      await this.prisma.paymentRefund.update({
        where: { id: refund.id },
        data: { providerRefundId: result.providerRefundId },
      });
      if (result.status === 'PENDING') {
        return false;
      }

      const { count } = await this.prisma.paymentRefund.updateMany({
        where: { id: refund.id, status: 'PENDING' },
        data: {
          status: result.status,
          refundedAt: result.status === 'REFUNDED' ? new Date() : null,
        },
      });
      if (count === 1 && result.status !== 'REFUNDED') {
        await this.restoreAmountDue(refund);
      }

      return count === 1 && result.status === 'REFUNDED';
    } catch (error) {
      const { count } = await this.prisma.paymentRefund.updateMany({
        where: { id: refund.id, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      if (count === 1) {
        await this.restoreAmountDue(refund);
      }

      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        `The payment provider rejected the refund: ${describeError(error)}`,
        { cause: error, fault: false, code: 'PAYMENT_PROVIDER_ERROR' },
      );
    }
  }

  /**
   * Lowers what a registration owes by a refund that was just booked, as a
   * manager's adjustment with the refund's reason. The part of it that only
   * gives back an overpayment owed nothing and leaves the amount due alone.
   * Returns the reduction, which `restoreAmountDue` gives back.
   */
  private async reduceAmountDue(
    tx: Prisma.TransactionClient,
    registrationId: string,
    amount: number,
    reason: string | null,
  ): Promise<number> {
    const registration = await tx.registration.findUniqueOrThrow({
      where: { id: registrationId },
    });
    if (registration.amountDue === null) {
      return 0;
    }

    const payments = await tx.payment.findMany({
      where: { registrationId },
      select: balanceSelect,
    });
    const { amountPaid } = registrationPayment(
      registration.amountDue,
      '',
      payments,
    );
    const overpaidBefore = overpaidAmount({
      amountDue: registration.amountDue,
      amountPaid: amountPaid + amount,
    });
    const reduction = Math.min(
      registration.amountDue,
      Math.max(0, amount - overpaidBefore),
    );
    if (reduction === 0) {
      return 0;
    }

    await tx.registration.update({
      where: { id: registrationId },
      data: {
        amountDue: registration.amountDue - reduction,
        amountDueAdjustedAt: new Date(),
        amountDueNote: reason ?? registration.amountDueNote,
      },
    });

    return reduction;
  }

  /**
   * Gives back what a refund that did not go through took off the amount
   * due. Once only: the reduction is cleared with it.
   */
  async restoreAmountDue(
    refund: Pick<PaymentRefund, 'id' | 'paymentId'>,
  ): Promise<void> {
    await this.transaction(async (tx) => {
      const current = await tx.paymentRefund.findUniqueOrThrow({
        where: { id: refund.id },
        include: { payment: { select: { registrationId: true } } },
      });
      const { registrationId } = current.payment;
      if (!current.amountDueReduction || !registrationId) {
        return;
      }

      const registration = await tx.registration.update({
        where: { id: registrationId },
        data: { amountDue: { increment: current.amountDueReduction } },
      });
      await tx.paymentRefund.update({
        where: { id: refund.id },
        data: { amountDueReduction: null },
      });
      await this.audit.record(
        paymentAuditEntry(registration, 'amount_due_adjusted', {
          amountDue: registration.amountDue,
        }),
      );
    });
  }

  /**
   * Records a refund that went through (or was accepted by the provider),
   * with what it took off the amount due.
   */
  private async recordRefund(refund: PaymentRefund): Promise<void> {
    await this.transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: refund.paymentId },
        include: { registration: true },
      });
      if (!payment.registration) {
        return;
      }

      await this.audit.record(
        paymentAuditEntry(payment.registration, 'payment_refunded', {
          amount: refund.amount,
        }),
      );
      if (refund.amountDueReduction) {
        await this.audit.record(
          paymentAuditEntry(payment.registration, 'amount_due_adjusted', {
            amountDue: payment.registration.amountDue,
          }),
        );
      }
    });
  }
}
