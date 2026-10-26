import { inject, injectable } from 'inversify';
import {
  type Payment,
  type PaymentRefund,
  type PaymentStatus,
  Prisma,
  type RefundStatus,
} from '#generated/prisma/client.js';
import type { Event, Registration } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import logger from '#core/logger';
import { describeError } from '#utils/errors';
import { AuditService } from '#app/audit/audit.service';
import { PaymentAccountService } from '#app/paymentAccount/payment-account.service';
import type {
  ProviderPaymentSnapshot,
  ProviderRefundSnapshot,
} from '#app/paymentAccount/providers/payment.provider';
import { paymentAuditEntry } from './payment.audit.js';

const PAYMENT_STATUS_RANK: Record<PaymentStatus, number> = {
  OPEN: 0,
  PENDING: 1,
  PAID: 2,
  FAILED: 2,
  CANCELED: 2,
  EXPIRED: 2,
};

/**
 * Statuses only move forward: a late or replayed webhook can never undo a
 * newer state. A terminal non-paid state may still turn `PAID` — the money
 * arrived after all, and the ledger must say so.
 */
export function isPaymentStatusAdvance(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  if (from === to || from === 'PAID') {
    return false;
  }
  if (to === 'PAID') {
    return true;
  }

  return PAYMENT_STATUS_RANK[to] > PAYMENT_STATUS_RANK[from];
}

export function isRefundStatusAdvance(
  from: RefundStatus,
  to: RefundStatus,
): boolean {
  return from === 'PENDING' && to !== 'PENDING';
}

/** What a reconciliation changed, so the caller can notify (mail, realtime). */
export interface ReconciliationOutcome {
  payment: Payment;
  registration: Registration | null;
  event: Event;
  /** The new payment status, if it changed. */
  statusChange: PaymentStatus | null;
  /** Refunds that just completed. */
  completedRefunds: PaymentRefund[];
  /** Whether anything at all was written. */
  changed: boolean;
}

/**
 * The single path by which provider state enters the ledger: re-fetched from
 * the provider, never taken from a webhook body, and applied idempotently.
 * Sends no mail and emits nothing — callers hand the outcome to the notifier.
 */
@injectable()
export class PaymentReconciliationService extends BaseService {
  constructor(
    @inject(PaymentAccountService)
    private readonly accountService: PaymentAccountService,
    @inject(AuditService) private readonly audit: AuditService,
  ) {
    super();
  }

  async isKnownProviderPayment(
    source: string,
    providerPaymentId: string,
  ): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: { source, providerPaymentId },
    });

    return count > 0;
  }

  /**
   * Re-fetches a provider payment and applies it. The single path by which
   * provider state enters the ledger — webhooks and the participant's return
   * both end up here.
   */
  async reconcileProviderPayment(
    source: string,
    providerPaymentId: string,
  ): Promise<ReconciliationOutcome | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { source_providerPaymentId: { source, providerPaymentId } },
      include: { event: true },
    });
    if (!payment) {
      logger.debug(
        `Not reconciling unknown ${source} payment ${providerPaymentId}`,
      );
      return null;
    }

    const resolved = await this.accountService.resolveForOrganization(
      payment.event.organizationId,
    );
    if (resolved?.account.provider !== source) {
      logger.warn(
        `Cannot reconcile ${source} payment ${providerPaymentId}: the organization's account changed`,
      );
      return null;
    }

    const snapshot = await resolved.provider.fetchPayment(
      resolved.credentials,
      providerPaymentId,
    );

    return this.applySnapshot(payment.id, snapshot);
  }

  /** Reconciles a registration's latest unsettled provider payment, if any. */
  async reconcileLatestOpen(
    registrationId: string,
  ): Promise<ReconciliationOutcome | null> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        registrationId,
        source: { not: 'manual' },
        providerPaymentId: { not: null },
        status: { in: ['OPEN', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment?.providerPaymentId) {
      return null;
    }

    try {
      return await this.reconcileProviderPayment(
        payment.source,
        payment.providerPaymentId,
      );
    } catch (error) {
      logger.warn(
        `Failed to reconcile payment ${payment.id}: ${describeError(error)}`,
      );
      return null;
    }
  }

  async applySnapshot(
    paymentId: string,
    snapshot: ProviderPaymentSnapshot,
  ): Promise<ReconciliationOutcome> {
    return this.transaction(
      async (tx) => {
        const current = await tx.payment.findUniqueOrThrow({
          where: { id: paymentId },
          include: { refunds: true, event: true, registration: true },
        });

        let changed = false;
        let statusChange: PaymentStatus | null = null;
        let payment: Payment = current;

        if (isPaymentStatusAdvance(current.status, snapshot.status)) {
          statusChange = snapshot.status;
          payment = await tx.payment.update({
            where: { id: current.id },
            data: {
              status: snapshot.status,
              method: snapshot.method ?? current.method,
              paidAt:
                snapshot.status === 'PAID'
                  ? (snapshot.paidAt ?? new Date())
                  : current.paidAt,
            },
          });
          changed = true;
          // Reported by the provider: no one did this in the app.
          if (current.registration) {
            await this.audit.record({
              ...paymentAuditEntry(
                current.registration,
                'payment_status_changed',
                { paymentStatus: snapshot.status, amount: current.amount },
              ),
              actorId: null,
            });
          }
        }

        const completedRefunds: PaymentRefund[] = [];
        for (const refundSnapshot of snapshot.refunds) {
          const result = await this.applyRefundSnapshot(
            tx,
            current.id,
            current.refunds,
            refundSnapshot,
          );
          if (result.changed) {
            changed = true;
          }
          if (result.completed) {
            completedRefunds.push(result.completed);
          }
        }

        return {
          payment,
          registration: current.registration,
          event: current.event,
          statusChange,
          completedRefunds,
          changed,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async applyRefundSnapshot(
    tx: Prisma.TransactionClient,
    paymentId: string,
    known: PaymentRefund[],
    snapshot: ProviderRefundSnapshot,
  ): Promise<{ changed: boolean; completed: PaymentRefund | null }> {
    // Our own refund is matched by provider id, or — before we stored that —
    // by the reference we passed; anything else was made in the dashboard.
    const existing =
      known.find((r) => r.providerRefundId === snapshot.providerRefundId) ??
      known.find(
        (r) => r.providerRefundId === null && r.id === snapshot.reference,
      );

    if (!existing) {
      const created = await tx.paymentRefund.create({
        data: {
          paymentId,
          providerRefundId: snapshot.providerRefundId,
          status: snapshot.status,
          amount: snapshot.amount,
          refundedAt: snapshot.refundedAt,
        },
      });

      return {
        changed: true,
        completed: created.status === 'REFUNDED' ? created : null,
      };
    }

    const advance = isRefundStatusAdvance(existing.status, snapshot.status);
    if (!advance && existing.providerRefundId !== null) {
      return { changed: false, completed: null };
    }

    const updated = await tx.paymentRefund.update({
      where: { id: existing.id },
      data: {
        providerRefundId: snapshot.providerRefundId,
        ...(advance
          ? { status: snapshot.status, refundedAt: snapshot.refundedAt }
          : {}),
      },
    });

    return {
      changed: true,
      completed: advance && updated.status === 'REFUNDED' ? updated : null,
    };
  }
}
