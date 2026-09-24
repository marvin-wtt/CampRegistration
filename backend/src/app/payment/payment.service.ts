import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import {
  type Event,
  type Organization,
  type Payment,
  type PaymentRefund,
  type PaymentStatus,
  Prisma,
  type RefundStatus,
  type Registration,
} from '#generated/prisma/client.js';
import type {
  RegistrationPayment,
  RegistrationPaymentSummary,
} from '@camp-registration/common/entities';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { PaymentSettings } from '@camp-registration/common/settings';
import { toMinorUnits } from '@camp-registration/common/utils';
import { BaseService } from '#core/base/BaseService';
import logger from '#core/logger';
import ApiError from '#utils/ApiError';
import { describeError } from '#utils/errors';
import { translateObject } from '#utils/translateObject';
import { ulid } from '#utils/ulid';
import { SettingService } from '#app/setting/setting.service';
import {
  PaymentAccountService,
  paymentWebhookUrl,
  type ResolvedPaymentAccount,
} from './payment-account.service.js';
import type {
  ProviderPaymentSnapshot,
  ProviderRefundSnapshot,
} from './providers/payment.provider.js';
import {
  outstandingAmount,
  refundableAmount,
  registrationPayment,
} from './payment.balance.js';
import { computeAmountDue } from './payment-amount.js';
import { paymentPageUrl } from './payment-link.js';

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  enabled: false,
  timing: 'ACCEPTANCE',
  reminderAfterDays: null,
};

// A checkout closer than this to expiring is not handed out again.
const CHECKOUT_REUSE_MARGIN_MS = 5 * 60 * 1000;

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

const paymentInclude = {
  refunds: {
    orderBy: { createdAt: 'asc' },
    include: { createdBy: { select: { name: true } } },
  },
  createdBy: { select: { name: true } },
} satisfies Prisma.PaymentInclude;

export type PaymentWithDetails = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;

type EventWithOrganization = Event & {
  organization: Pick<Organization, 'verificationStatus'>;
};

/** What a sync changed, so the caller can notify (mail, realtime). */
export interface PaymentSyncOutcome {
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
 * The payment ledger and its lifecycle, independent of any provider:
 * providers are reached only through `PaymentProvider`. Sends no mail and
 * emits nothing itself — callers act on the returned outcomes.
 */
@injectable()
export class PaymentService extends BaseService {
  constructor(
    @inject(PaymentAccountService)
    private readonly accountService: PaymentAccountService,
    @inject(SettingService)
    private readonly settingService: SettingService,
  ) {
    super();
  }

  async getSettings(eventId: string): Promise<PaymentSettings> {
    const setting = await this.settingService.getSetting(
      eventId,
      SETTING_KEYS.PAYMENT,
    );

    return {
      ...DEFAULT_PAYMENT_SETTINGS,
      ...(setting?.data as Partial<PaymentSettings> | undefined),
    };
  }

  /**
   * The amount a new submission owes, or `null` when the event doesn't
   * collect payments. Snapshotted onto the registration at submit.
   */
  async amountDueFor(
    event: Pick<Event, 'id' | 'price' | 'currency'>,
    dataByTags: Record<string, unknown[]>,
  ): Promise<number | null> {
    const settings = await this.getSettings(event.id);

    return settings.enabled ? computeAmountDue(event, dataByTags) : null;
  }

  async getBalance(
    registration: Pick<Registration, 'id' | 'amountDue'>,
    currency: string,
  ): Promise<RegistrationPayment> {
    const payments = await this.prisma.payment.findMany({
      where: { registrationId: registration.id },
      select: {
        status: true,
        amount: true,
        refunds: { select: { status: true, amount: true } },
      },
    });

    return registrationPayment(registration.amountDue, currency, payments);
  }

  async queryEventPayments(eventId: string): Promise<PaymentWithDetails[]> {
    return this.prisma.payment.findMany({
      where: { eventId },
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async queryRegistrationPayments(
    registrationId: string,
  ): Promise<PaymentWithDetails[]> {
    return this.prisma.payment.findMany({
      where: { registrationId },
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayment(
    registrationId: string,
    paymentId: string,
  ): Promise<PaymentWithDetails | null> {
    return this.prisma.payment.findFirst({
      where: { id: paymentId, registrationId },
      include: paymentInclude,
    });
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

  async markRequested(registrationId: string): Promise<void> {
    await this.prisma.registration.update({
      where: { id: registrationId },
      data: { paymentRequestedAt: new Date() },
    });
  }

  /** The public view behind a registration's payment link. */
  async getSummary(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<RegistrationPaymentSummary> {
    const balance = await this.getBalance(registration, event.currency);
    const latest = await this.prisma.payment.findFirst({
      where: { registrationId: registration.id, source: { not: 'manual' } },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });
    const account = await this.accountService.getByOrganization(
      event.organizationId,
    );
    const settings = await this.getSettings(event.id);

    return {
      ...balance,
      registrationId: registration.id,
      eventId: event.id,
      latestPaymentStatus: latest?.status ?? null,
      payable:
        outstandingAmount(balance) > 0 &&
        this.mayPayYet(settings, registration) &&
        event.organization.verificationStatus === 'VERIFIED' &&
        account !== null,
    };
  }

  /**
   * Waitlisted registrations never pay; with `ACCEPTANCE` timing nobody pays
   * before being accepted either.
   */
  private mayPayYet(
    settings: PaymentSettings,
    registration: Pick<Registration, 'status'>,
  ): boolean {
    if (registration.status === 'WAITLISTED') {
      return false;
    }

    return (
      settings.timing === 'REGISTRATION' || registration.status === 'ACCEPTED'
    );
  }

  /**
   * Opens (or reuses) a provider checkout for the outstanding balance.
   * Refuses — rather than failing later at the provider — when there is
   * nothing to pay or nowhere to pay it to.
   */
  async startCheckout(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<{ checkoutUrl: string; payment: Payment }> {
    if (!this.mayPayYet(await this.getSettings(event.id), registration)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This registration cannot be paid before it is accepted',
        { code: 'PAYMENT_NOT_ACCEPTED' },
      );
    }
    if (event.organization.verificationStatus !== 'VERIFIED') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The organizer cannot accept payments yet',
        { code: 'PAYMENT_ORGANIZATION_UNVERIFIED' },
      );
    }

    const balance = await this.getBalance(registration, event.currency);
    const amount = outstandingAmount(balance);
    if (amount <= 0) {
      throw new ApiError(httpStatus.CONFLICT, 'Nothing is due', {
        code: 'PAYMENT_NOTHING_DUE',
      });
    }

    const resolved = await this.accountService.resolveForOrganization(
      event.organizationId,
    );
    if (!resolved) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The organizer has not connected a payment provider',
        { code: 'PAYMENT_NO_ACCOUNT' },
      );
    }

    const reusable = await this.prisma.payment.findFirst({
      where: {
        registrationId: registration.id,
        source: resolved.account.provider,
        status: 'OPEN',
        amount,
        checkoutUrl: { not: null },
        OR: [
          { expiresAt: null },
          {
            expiresAt: { gt: new Date(Date.now() + CHECKOUT_REUSE_MARGIN_MS) },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (reusable?.checkoutUrl) {
      return { checkoutUrl: reusable.checkoutUrl, payment: reusable };
    }

    return this.createCheckout(event, registration, resolved, amount);
  }

  private async createCheckout(
    event: Event,
    registration: Registration,
    { account, provider, credentials }: ResolvedPaymentAccount,
    amount: number,
  ): Promise<{ checkoutUrl: string; payment: Payment }> {
    // The row exists first, so its id can be the provider-side reference.
    const pending = await this.prisma.payment.create({
      data: {
        id: ulid(),
        registrationId: registration.id,
        eventId: event.id,
        source: account.provider,
        status: 'OPEN',
        amount,
        currency: event.currency,
      },
    });

    const name = [registration.firstName, registration.lastName]
      .filter(Boolean)
      .join(' ');
    const eventName = translateObject(event.name, registration.locale);

    try {
      const checkout = await provider.createCheckout(credentials, {
        amount,
        currency: event.currency,
        description: name ? `${eventName} – ${name}` : eventName,
        reference: pending.id,
        locale: registration.locale,
        email: registration.emails?.[0] ?? null,
        returnUrl: paymentPageUrl(event.id, registration.id, {
          returned: true,
        }),
        webhookUrl: paymentWebhookUrl(account),
      });

      const payment = await this.prisma.payment.update({
        where: { id: pending.id },
        data: {
          providerPaymentId: checkout.providerPaymentId,
          checkoutUrl: checkout.checkoutUrl,
          expiresAt: checkout.expiresAt,
        },
      });

      if (!registration.paymentRequestedAt) {
        await this.markRequested(registration.id);
      }

      return { checkoutUrl: checkout.checkoutUrl, payment };
    } catch (error) {
      await this.prisma.payment.delete({ where: { id: pending.id } });

      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        'The payment provider could not start a checkout',
        { cause: error, fault: false, code: 'PAYMENT_PROVIDER_ERROR' },
      );
    }
  }

  /**
   * Re-fetches a provider payment and applies it. The single path by which
   * provider state enters the ledger — webhooks and the participant's return
   * both end up here.
   */
  async syncProviderPayment(
    source: string,
    providerPaymentId: string,
  ): Promise<PaymentSyncOutcome | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { source_providerPaymentId: { source, providerPaymentId } },
      include: { event: true },
    });
    if (!payment) {
      logger.debug(
        `Ignoring sync for unknown ${source} payment ${providerPaymentId}`,
      );
      return null;
    }

    const resolved = await this.accountService.resolveForOrganization(
      payment.event.organizationId,
    );
    if (resolved?.account.provider !== source) {
      logger.warn(
        `Cannot sync ${source} payment ${providerPaymentId}: the organization's account changed`,
      );
      return null;
    }

    const snapshot = await resolved.provider.fetchPayment(
      resolved.credentials,
      providerPaymentId,
    );

    return this.applySnapshot(payment.id, snapshot);
  }

  /** Syncs a registration's latest unsettled provider payment, if any. */
  async syncLatestOpen(
    registrationId: string,
  ): Promise<PaymentSyncOutcome | null> {
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
      return await this.syncProviderPayment(
        payment.source,
        payment.providerPaymentId,
      );
    } catch (error) {
      logger.warn(
        `Failed to sync payment ${payment.id}: ${describeError(error)}`,
      );
      return null;
    }
  }

  async applySnapshot(
    paymentId: string,
    snapshot: ProviderPaymentSnapshot,
  ): Promise<PaymentSyncOutcome> {
    return this.prisma.$transaction(
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

  /** Records money received outside the app (bank transfer, cash). */
  async createManualPayment(
    event: Event,
    registration: Registration,
    data: {
      amount: number;
      paidAt?: Date;
      method?: string | null;
      note?: string | null;
    },
    userId: string,
  ): Promise<PaymentWithDetails> {
    return this.prisma.payment.create({
      data: {
        registrationId: registration.id,
        eventId: event.id,
        source: 'manual',
        status: 'PAID',
        amount: toMinorUnits(data.amount, event.currency),
        currency: event.currency,
        method: data.method ?? null,
        note: data.note ?? null,
        paidAt: data.paidAt ?? new Date(),
        createdById: userId,
      },
      include: paymentInclude,
    });
  }

  /** Only manual entries without refunds can be removed — a typo fix, not an undo. */
  async deleteManualPayment(payment: PaymentWithDetails): Promise<void> {
    if (payment.source !== 'manual') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Only manually recorded payments can be deleted; refund online payments instead',
      );
    }
    if (payment.refunds.length > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'A payment with refunds cannot be deleted',
      );
    }

    await this.prisma.payment.delete({ where: { id: payment.id } });
  }

  /**
   * Gives money back. The limit check and the PENDING row are one
   * serializable transaction, so concurrent refunds can never exceed what
   * was paid; the provider is called only after it committed. A manual
   * payment's refund is recorded as already done.
   */
  async refund(
    event: Event,
    paymentId: string,
    data: { amount: number; reason: string | null; notifyParticipant: boolean },
    userId: string,
  ): Promise<{
    refund: PaymentRefund;
    payment: PaymentWithDetails;
    /** Whether this call moved the refund to `REFUNDED` (so it alone notifies). */
    completedNow: boolean;
  }> {
    const payment = await this.prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });

    let resolved: ResolvedPaymentAccount | null = null;
    if (payment.source !== 'manual') {
      resolved = await this.accountService.resolveForOrganization(
        event.organizationId,
      );
      if (
        resolved?.account.provider !== payment.source ||
        !payment.providerPaymentId
      ) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'The payment provider account this payment was made with is no longer connected. Refund it outside the app and record that manually.',
          { code: 'PAYMENT_ACCOUNT_CHANGED' },
        );
      }
    }

    const refund = await this.prisma.$transaction(
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

        const manual = current.source === 'manual';

        return tx.paymentRefund.create({
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    let completedNow = refund.status === 'REFUNDED';

    if (resolved && payment.providerPaymentId) {
      try {
        const result = await resolved.provider.createRefund(
          resolved.credentials,
          payment.providerPaymentId,
          {
            amount: data.amount,
            currency: payment.currency,
            reason: data.reason,
            reference: refund.id,
          },
        );

        await this.prisma.paymentRefund.update({
          where: { id: refund.id },
          data: { providerRefundId: result.providerRefundId },
        });

        // A webhook may have raced ahead and settled it already: the
        // conditional update only moves a still-pending refund forward, so
        // exactly one of the two paths records (and notifies) completion.
        if (result.status !== 'PENDING') {
          const { count } = await this.prisma.paymentRefund.updateMany({
            where: { id: refund.id, status: 'PENDING' },
            data: {
              status: result.status,
              refundedAt: result.status === 'REFUNDED' ? new Date() : null,
            },
          });
          completedNow = count === 1 && result.status === 'REFUNDED';
        }
      } catch (error) {
        await this.prisma.paymentRefund.updateMany({
          where: { id: refund.id, status: 'PENDING' },
          data: { status: 'FAILED' },
        });

        throw new ApiError(
          httpStatus.BAD_GATEWAY,
          `The payment provider rejected the refund: ${describeError(error)}`,
          { cause: error, fault: false, code: 'PAYMENT_PROVIDER_ERROR' },
        );
      }
    }

    return {
      refund: await this.prisma.paymentRefund.findUniqueOrThrow({
        where: { id: refund.id },
      }),
      payment: await this.prisma.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: paymentInclude,
      }),
      completedNow,
    };
  }

  /**
   * Accepted registrations still owing money, whose last request or reminder
   * is at least `reminderAfterDays` old, for events that enabled reminders.
   */
  async findDueReminders(now = new Date()) {
    const settings = await this.prisma.eventSetting.findMany({
      where: { key: SETTING_KEYS.PAYMENT },
      select: { eventId: true, data: true },
    });

    const due: { event: Event; registration: Registration }[] = [];

    for (const setting of settings) {
      const data = {
        ...DEFAULT_PAYMENT_SETTINGS,
        ...(setting.data as Partial<PaymentSettings>),
      };
      if (!data.enabled || !data.reminderAfterDays) {
        continue;
      }

      const cutoff = new Date(
        now.getTime() - data.reminderAfterDays * 24 * 60 * 60 * 1000,
      );
      const registrations = await this.prisma.registration.findMany({
        where: {
          eventId: setting.eventId,
          status: 'ACCEPTED',
          amountDue: { gt: 0 },
          paymentRequestedAt: { lte: cutoff },
          OR: [
            { paymentReminderSentAt: null },
            { paymentReminderSentAt: { lte: cutoff } },
          ],
        },
        include: { event: true },
      });

      for (const { event, ...registration } of registrations) {
        const balance = await this.getBalance(registration, event.currency);
        if (outstandingAmount(balance) > 0) {
          due.push({ event, registration });
        }
      }
    }

    return due;
  }

  async markReminded(registrationId: string): Promise<void> {
    await this.prisma.registration.update({
      where: { id: registrationId },
      data: { paymentReminderSentAt: new Date() },
    });
  }
}
