import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';
import type { Payment, PaymentRefund, Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import type { PrismaTransaction } from '#core/database/transaction';
import ApiError from '#core/router/ApiError';
import { AuditService } from '#app/audit/audit.service';
import { paymentAuditEntry } from '#app/payment/payment.audit';
import {
  paymentBalance,
  refundableAmount,
  refundedAmount,
} from '@camp-registration/common/utils';
import {
  PAYMENT_SETTLEMENT_REQUIRED,
  type AmountDueUpdateData,
  type PaymentCreateData,
  type PaymentRefundCreateData,
  type PaymentSettlement,
  type PaymentUpdateData,
} from '@camp-registration/common/entities';

const paymentInclude = {
  refunds: { orderBy: [{ refundedOn: 'asc' }, { id: 'asc' }] },
} as const satisfies Prisma.PaymentInclude;

const paymentOrder = [
  { paidOn: 'asc' },
  { id: 'asc' },
] as const satisfies Prisma.PaymentOrderByWithRelationInput[];

export type PaymentWithRefunds = Payment & { refunds: PaymentRefund[] };

/**
 * What the fees view reads of a registration: an allowlist, never the
 * answers (docs/payments.md, "Treasurer's view").
 */
const feeSelect = {
  id: true,
  eventId: true,
  firstName: true,
  lastName: true,
  emails: true,
  status: true,
  group: true,
  createdAt: true,
  quotedAmount: true,
  currency: true,
  amountDueOverride: true,
  amountDueNote: true,
  amountDueAdjustedAt: true,
  paymentReference: true,
  payments: { include: paymentInclude, orderBy: paymentOrder },
} as const satisfies Prisma.RegistrationSelect;

export type FeeRegistration = Prisma.RegistrationGetPayload<{
  select: typeof feeSelect;
}>;

/** A registration with the event values its fee needs. */
export interface RegistrationFeeData {
  /** The registration's, so it binds like any model. */
  id: string;
  registration: FeeRegistration;
  currency: string;
}

export type FeeExportPayment = PaymentWithRefunds & {
  registration: { paymentReference: string } | null;
};

/** Years payer names of deleted registrations are kept (HGB § 257, AO § 147). */
export const DEFAULT_RECORD_RETENTION_YEARS = 10;

@injectable()
export class PaymentService extends BaseService {
  constructor(@inject(AuditService) private readonly audit: AuditService) {
    super();
  }

  async queryRegistrationFees(event: {
    id: string;
    currency: string;
  }): Promise<RegistrationFeeData[]> {
    const registrations = await this.prisma.registration.findMany({
      where: { eventId: event.id },
      select: feeSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return registrations.map((registration) => ({
      id: registration.id,
      registration,
      currency: registration.currency ?? event.currency,
    }));
  }

  /** Payments whose registration is gone, kept as the accounting record. */
  async queryOrphanedPayments(eventId: string) {
    return this.prisma.payment.findMany({
      where: { eventId, registrationId: null },
      include: paymentInclude,
      orderBy: paymentOrder,
    });
  }

  async getRegistrationFee(
    event: { id: string; currency: string },
    registrationId: string,
  ): Promise<RegistrationFeeData | null> {
    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, eventId: event.id },
      select: feeSelect,
    });

    return registration
      ? {
          id: registration.id,
          registration,
          currency: registration.currency ?? event.currency,
        }
      : null;
  }

  async getPaymentById(eventId: string, id: string) {
    return this.prisma.payment.findFirst({
      where: { id, eventId },
      include: paymentInclude,
    });
  }

  async recordPayment(
    fee: RegistrationFeeData,
    data: PaymentCreateData,
    createdByUserId: string,
  ) {
    const { registration } = fee;

    return this.transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          eventId: registration.eventId,
          registrationId: registration.id,
          registrationRef: registration.id,
          payerName: payerName(registration),
          amount: data.amount,
          currency: fee.currency,
          method: data.method,
          paidOn: data.paidOn,
          note: data.note ?? null,
          createdByUserId,
        },
      });

      await this.audit.record(
        paymentAuditEntry(auditSubject(payment), 'payment_recorded', {
          amount: payment.amount,
          method: payment.method,
          paidOn: payment.paidOn,
        }),
      );

      return payment;
    });
  }

  async updatePayment(payment: PaymentWithRefunds, data: PaymentUpdateData) {
    return this.transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { paidOn: data.paidOn, note: data.note },
        include: paymentInclude,
      });

      if (updated.paidOn !== payment.paidOn) {
        await this.audit.record(
          paymentAuditEntry(auditSubject(payment), 'payment_updated', {
            amount: payment.amount,
            paidOn: updated.paidOn,
          }),
        );
      }

      return updated;
    });
  }

  /** For recording errors; its refunds go with it. */
  async deletePayment(payment: PaymentWithRefunds) {
    await this.transaction(async (tx) => {
      await tx.payment.delete({ where: { id: payment.id } });
      await this.audit.record(
        paymentAuditEntry(auditSubject(payment), 'payment_deleted', {
          amount: payment.amount,
          refunded: refundedAmount(payment),
        }),
      );
    });
  }

  async refundPayment(
    payment: PaymentWithRefunds,
    data: PaymentRefundCreateData,
    createdByUserId: string,
  ) {
    return this.transaction(async (tx) => {
      // The registration first, then the payment: two refunds of one
      // registration see each other's reduction and refundable amount.
      if (payment.registrationId) {
        await tx.$queryRaw`SELECT id FROM registrations WHERE id = ${payment.registrationId} FOR UPDATE`;
      }
      await tx.$queryRaw`SELECT id FROM payments WHERE id = ${payment.id} FOR UPDATE`;
      const current = await tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: paymentInclude,
      });

      if (data.amount > refundableAmount(current)) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'The refund is more than is left of the payment.',
        );
      }

      const amountDueReduction = data.reduceAmountDue
        ? await this.cancellationReduction(tx, current, data.amount)
        : 0;

      const refund = await tx.paymentRefund.create({
        data: {
          paymentId: current.id,
          amount: data.amount,
          refundedOn: data.refundedOn,
          reason: data.reason ?? null,
          amountDueReduction,
          createdByUserId,
        },
      });

      await this.audit.record(
        paymentAuditEntry(auditSubject(current), 'payment_refunded', {
          amount: refund.amount,
          amountDueReduction,
          refundedOn: refund.refundedOn,
        }),
      );

      return tx.payment.findUniqueOrThrow({
        where: { id: current.id },
        include: paymentInclude,
      });
    });
  }

  /** For recording errors; what it took off the amount due comes back. */
  async deleteRefund(payment: PaymentWithRefunds, refundId: string) {
    const refund = payment.refunds.find(({ id }) => id === refundId);
    if (!refund) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Refund not found');
    }

    return this.transaction(async (tx) => {
      await tx.paymentRefund.delete({ where: { id: refund.id } });
      await this.audit.record(
        paymentAuditEntry(auditSubject(payment), 'payment_refund_deleted', {
          amount: refund.amount,
          amountDueReduction: refund.amountDueReduction,
        }),
      );

      return tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: paymentInclude,
      });
    });
  }

  async setAmountDue(registration: FeeRegistration, data: AmountDueUpdateData) {
    const reset = data.amount === null;

    await this.transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          amountDueOverride: data.amount,
          amountDueNote: reset ? null : (data.note ?? null),
          amountDueAdjustedAt: reset ? null : new Date(),
        },
      });

      await this.audit.record(
        paymentAuditEntry(
          { registrationId: registration.id, eventId: registration.eventId },
          reset ? 'amount_due_reset' : 'amount_due_adjusted',
          reset
            ? { quotedAmount: registration.quotedAmount }
            : {
                from:
                  registration.amountDueOverride ?? registration.quotedAmount,
                to: data.amount,
              },
        ),
      );
    });
  }

  /** Paid minus refunded: the money a registration still holds. */
  async heldAmount(registrationId: string): Promise<number> {
    const payments = await this.db.payment.findMany({
      where: { registrationId },
      include: paymentInclude,
    });

    return payments.reduce(
      (sum, payment) => sum + payment.amount - refundedAmount(payment),
      0,
    );
  }

  /**
   * Before deleting one registration: one still holding money needs a
   * settlement, recorded on its payments. Runs in the caller's transaction.
   */
  async settleForDeletion(
    registration: { id: string; eventId: string },
    settlement: PaymentSettlement | undefined,
  ): Promise<void> {
    const held = await this.heldAmount(registration.id);
    if (held === 0) {
      return;
    }
    if (!settlement) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The registration still holds money: settle it first.',
        { code: PAYMENT_SETTLEMENT_REQUIRED },
      );
    }

    await this.db.payment.updateMany({
      where: { registrationId: registration.id },
      data: { settlement },
    });
    await this.audit.record(
      paymentAuditEntry(
        { registrationId: registration.id, eventId: registration.eventId },
        'payment_settled',
        { held, settlement },
      ),
    );
  }

  /**
   * Clears payer names of payments whose registration is gone, once the
   * retention period passed for the payment and its last refund — counted
   * from the end of that calendar year. The amounts stay.
   */
  async clearExpiredPayerNames(
    now = new Date(),
    years = DEFAULT_RECORD_RETENTION_YEARS,
  ): Promise<number> {
    // A 2016 payment is kept through 2026: due in 2027 with ten years.
    const cutoff = `${(now.getUTCFullYear() - years).toString()}-01-01`;

    const { count } = await this.prisma.payment.updateMany({
      where: {
        registrationId: null,
        payerName: { not: null },
        paidOn: { lt: cutoff },
        refunds: { none: { refundedOn: { gte: cutoff } } },
      },
      data: { payerName: null },
    });

    return count;
  }

  /** Every payment and refund of the event, for the finance export. */
  async getExportData(eventId: string): Promise<FeeExportPayment[]> {
    return this.prisma.payment.findMany({
      where: { eventId },
      include: {
        ...paymentInclude,
        registration: { select: { paymentReference: true } },
      },
      orderBy: paymentOrder,
    });
  }

  /**
   * What a cancelling refund takes off the amount due: the part beyond any
   * overpayment, at most what is due.
   */
  private async cancellationReduction(
    tx: PrismaTransaction,
    payment: PaymentWithRefunds,
    amount: number,
  ): Promise<number> {
    if (!payment.registrationId) {
      return 0;
    }

    const registration = await tx.registration.findUniqueOrThrow({
      where: { id: payment.registrationId },
      select: {
        quotedAmount: true,
        amountDueOverride: true,
        payments: { include: paymentInclude },
      },
    });
    const balance = paymentBalance(
      registration,
      payment.currency,
      registration.payments,
    );

    return Math.min(
      Math.max(0, amount - balance.overpaid),
      balance.amountDue ?? 0,
    );
  }
}

function payerName(registration: {
  firstName: string | null;
  lastName: string | null;
}): string | null {
  const name = [registration.firstName, registration.lastName]
    .filter(Boolean)
    .join(' ')
    .slice(0, 255);

  return name || null;
}

function auditSubject(payment: Pick<Payment, 'registrationRef' | 'eventId'>) {
  return { registrationId: payment.registrationRef, eventId: payment.eventId };
}
