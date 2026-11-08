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
  ProviderChargebackSnapshot,
  ProviderPaymentSnapshot,
  ProviderRefundSnapshot,
} from '#app/paymentAccount/providers/payment.provider';
import { type PaymentAuditAction, paymentAuditEntry } from './payment.audit.js';
import { PaymentService } from './payment.service.js';
import { PaymentRefundService } from './payment-refund.service.js';

// The public payment page polls; the provider is asked at most this often
// per payment and process.
const RECONCILE_INTERVAL_MS = 5_000;
// A webhook and the page's poll may apply the same payment at once.
const CONFLICT_RETRIES = 3;

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

/** Like a refund, except that a lost chargeback can still be reversed. */
export function isChargebackStatusAdvance(
  from: RefundStatus,
  to: RefundStatus,
): boolean {
  return (
    isRefundStatusAdvance(from, to) ||
    (from === 'REFUNDED' && to === 'CANCELED')
  );
}

type PaymentWithLedger = Payment & {
  refunds: PaymentRefund[];
  registration: Registration | null;
};

/** What a reconciliation changed, so the caller can notify (mail, realtime). */
export interface ReconciliationOutcome {
  payment: Payment;
  registration: Registration | null;
  event: Event;
  /** The new payment status, if it changed. */
  statusChange: PaymentStatus | null;
  /** Refunds (not chargebacks) that just completed. */
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
  private readonly lastReconciled = new Map<string, number>();

  constructor(
    @inject(PaymentAccountService)
    private readonly accountService: PaymentAccountService,
    @inject(AuditService) private readonly audit: AuditService,
    @inject(PaymentService) private readonly paymentService: PaymentService,
    @inject(PaymentRefundService)
    private readonly refundService: PaymentRefundService,
  ) {
    super();
  }

  /** Whether the payment was made through this account. */
  async isKnownProviderPayment(
    accountId: string,
    providerPaymentId: string,
  ): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: { paymentAccountId: accountId, providerPaymentId },
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
    });
    if (!payment) {
      logger.debug(
        `Not reconciling unknown ${source} payment ${providerPaymentId}`,
      );
      return null;
    }

    // Through the account it was made with, even if since replaced.
    const resolved = await this.accountService.resolveForPayment(payment);
    if (!resolved) {
      logger.warn(
        `Cannot reconcile ${source} payment ${providerPaymentId}: it has no account`,
      );
      return null;
    }

    const snapshot = await resolved.provider.fetchPayment(
      resolved.credentials,
      providerPaymentId,
    );

    return this.applySnapshot(payment.id, snapshot);
  }

  /**
   * Reconciles a registration's latest unsettled provider payment, if any —
   * at most once per `RECONCILE_INTERVAL_MS`, as the payment page polls.
   */
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
    if (!payment?.providerPaymentId || this.throttled(payment.id)) {
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

  private throttled(paymentId: string, now = Date.now()): boolean {
    for (const [id, at] of this.lastReconciled) {
      if (now - at >= RECONCILE_INTERVAL_MS) {
        this.lastReconciled.delete(id);
      }
    }
    if (this.lastReconciled.has(paymentId)) {
      return true;
    }

    this.lastReconciled.set(paymentId, now);
    return false;
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
          await this.recordProviderChange(
            current.registration,
            'payment_status_changed',
            { paymentStatus: snapshot.status, amount: current.amount },
          );
        }

        const completedRefunds: PaymentRefund[] = [];
        for (const refundSnapshot of snapshot.refunds) {
          const result = await this.applyRefundSnapshot(
            tx,
            current,
            refundSnapshot,
          );
          changed ||= result.changed;
          if (result.completed) {
            completedRefunds.push(result.completed);
          }
        }
        for (const chargeback of snapshot.chargebacks) {
          if (await this.applyChargebackSnapshot(tx, current, chargeback)) {
            changed = true;
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
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        retries: CONFLICT_RETRIES,
      },
    );
  }

  /** Reported by the provider: no one did this in the app. */
  private async recordProviderChange(
    registration: Registration | null,
    action: PaymentAuditAction,
    values: Record<string, string | number>,
  ): Promise<void> {
    if (registration) {
      await this.audit.record({
        ...paymentAuditEntry(registration, action, values),
        actorId: null,
      });
    }
  }

  private async applyRefundSnapshot(
    tx: Prisma.TransactionClient,
    payment: PaymentWithLedger,
    snapshot: ProviderRefundSnapshot,
  ): Promise<{ changed: boolean; completed: PaymentRefund | null }> {
    const known = payment.refunds.filter((r) => r.kind === 'REFUND');
    // Our own refund is matched by provider id, or — before we stored that —
    // by the reference we passed; anything else was made in the dashboard.
    const existing =
      known.find((r) => r.providerRefundId === snapshot.providerRefundId) ??
      known.find(
        (r) => r.providerRefundId === null && r.id === snapshot.reference,
      );

    if (!existing) {
      // Made in the provider's dashboard, where the organizer decided
      // whether to tell the participant: the app doesn't.
      const created = await tx.paymentRefund.create({
        data: {
          paymentId: payment.id,
          providerRefundId: snapshot.providerRefundId,
          status: snapshot.status,
          amount: snapshot.amount,
          refundedAt: snapshot.refundedAt,
          notifyParticipant: false,
        },
      });
      if (created.status === 'PENDING' || created.status === 'REFUNDED') {
        await this.recordProviderChange(
          payment.registration,
          'payment_refunded',
          { amount: created.amount },
        );
        await this.hold(payment);
      }

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

    if (advance && updated.status !== 'REFUNDED') {
      // The history said refunded and the amount due was lowered for it.
      await this.recordProviderChange(
        payment.registration,
        'payment_refund_failed',
        { amount: updated.amount },
      );
      await this.refundService.restoreAmountDue(updated);
      if (updated.createdById === null) {
        await this.releaseProviderHold(tx, payment);
      }
    }

    return {
      changed: true,
      completed: advance && updated.status === 'REFUNDED' ? updated : null,
    };
  }

  /** Books a chargeback like a refund, so the balance follows it. */
  private async applyChargebackSnapshot(
    tx: Prisma.TransactionClient,
    payment: PaymentWithLedger,
    snapshot: ProviderChargebackSnapshot,
  ): Promise<boolean> {
    const existing = payment.refunds.find(
      (r) =>
        r.kind === 'CHARGEBACK' &&
        r.providerRefundId === snapshot.providerChargebackId,
    );

    if (!existing) {
      await tx.paymentRefund.create({
        data: {
          paymentId: payment.id,
          providerRefundId: snapshot.providerChargebackId,
          kind: 'CHARGEBACK',
          status: snapshot.status,
          amount: snapshot.amount,
          refundedAt:
            snapshot.status === 'REFUNDED' ? snapshot.createdAt : null,
          notifyParticipant: false,
        },
      });
      await this.recordProviderChange(
        payment.registration,
        snapshot.status === 'CANCELED'
          ? 'payment_chargeback_reversed'
          : 'payment_charged_back',
        { amount: snapshot.amount },
      );
      if (snapshot.status !== 'CANCELED') {
        await this.hold(payment);
      }
      return true;
    }

    if (!isChargebackStatusAdvance(existing.status, snapshot.status)) {
      return false;
    }

    await tx.paymentRefund.update({
      where: { id: existing.id },
      data: {
        status: snapshot.status,
        refundedAt:
          snapshot.status === 'REFUNDED'
            ? (existing.refundedAt ?? new Date())
            : null,
      },
    });
    if (snapshot.status === 'CANCELED') {
      await this.recordProviderChange(
        payment.registration,
        'payment_chargeback_reversed',
        { amount: existing.amount },
      );
      await this.releaseProviderHold(tx, payment);
    }
    return true;
  }

  /** Money went back outside the app: a manager decides what is still owed. */
  private async hold(payment: PaymentWithLedger): Promise<void> {
    if (payment.registrationId) {
      await this.paymentService.holdPayments(payment.registrationId);
    }
  }

  /**
   * Money that went back outside the app returned after all — a chargeback
   * won or reversed, a dashboard refund failed: the hold it caused goes,
   * unless another such one of the registration still counts.
   */
  private async releaseProviderHold(
    tx: Prisma.TransactionClient,
    payment: PaymentWithLedger,
  ): Promise<void> {
    if (!payment.registrationId) {
      return;
    }
    const open = await tx.paymentRefund.count({
      where: {
        // Dashboard refunds are the ones no one in the app created.
        OR: [{ kind: 'CHARGEBACK' }, { kind: 'REFUND', createdById: null }],
        status: { in: ['PENDING', 'REFUNDED'] },
        payment: { registrationId: payment.registrationId },
      },
    });
    if (open === 0) {
      await this.paymentService.releaseHold(payment.registrationId);
    }
  }
}
