import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import {
  type Event,
  type Organization,
  type Payment,
  type PaymentRefund,
  Prisma,
  type Registration,
} from '#generated/prisma/client.js';
import type {
  PaymentSettlement,
  RegistrationPayment,
  RegistrationPaymentSummary,
} from '@camp-registration/common/entities';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { PaymentSettings } from '@camp-registration/common/settings';
import {
  paymentRequestsOpen,
  toMinorUnits,
  utcCarrierToNaiveDateTime,
  translate,
} from '@camp-registration/common/utils';
import { BaseService } from '#core/base/BaseService';
import config from '#config/index';
import ApiError from '#utils/ApiError';
import { describeError } from '#utils/errors';
import { ulid } from '#utils/ulid';
import { SettingService } from '#app/setting/setting.service';
import { AuditService } from '#app/audit/audit.service';
import { paymentAuditEntry } from './payment.audit.js';
import {
  PaymentAccountService,
  paymentWebhookUrl,
  type ResolvedPaymentAccount,
} from '#app/paymentAccount/payment-account.service';
import {
  outstandingAmount,
  refundableAmount,
  registrationPayment,
} from './payment.balance.js';
import { paymentPageUrl } from './payment-link.js';

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  enabled: false,
  timing: 'ACCEPTANCE',
  requestDate: null,
  requestDaysBeforeStart: null,
  reminderAfterDays: null,
};

// A checkout closer than this to expiring is not handed out again.
const CHECKOUT_REUSE_MARGIN_MS = 5 * 60 * 1000;

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

/** What a payment keeps of its registration for accounting. */
function payerSnapshot(
  registration: Pick<Registration, 'id' | 'firstName' | 'lastName'>,
): { payerName: string | null; registrationRef: string } {
  const name = [registration.firstName, registration.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return { payerName: name || null, registrationRef: registration.id };
}

interface AmountDueBefore {
  registrationId: string;
  amountDue: number | null;
  amountDueAdjustedAt: Date | null;
  amountDueNote: string | null;
}

type EventWithOrganization = Event & {
  organization: Pick<Organization, 'verificationStatus'>;
};

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
    @inject(AuditService) private readonly audit: AuditService,
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

  async markRequested(
    registration: Pick<Registration, 'id' | 'eventId'>,
  ): Promise<void> {
    await this.transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registration.id },
        data: { paymentRequestedAt: new Date() },
      });
      await this.audit.record(
        paymentAuditEntry(registration, 'payment_requested'),
      );
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
        this.mayPayYet(settings, event, registration) &&
        event.organization.verificationStatus === 'VERIFIED' &&
        account !== null,
    };
  }

  /**
   * Only accepted registrations pay, only once they are asked to, and only
   * while the event collects payments.
   */
  private mayPayYet(
    settings: PaymentSettings,
    event: Pick<Event, 'startAt' | 'timezone'>,
    registration: Pick<Registration, 'status'>,
  ): boolean {
    return (
      settings.enabled &&
      registration.status === 'ACCEPTED' &&
      this.requestsOpen(settings, event)
    );
  }

  /** Accepted registrations that owe money but were never asked to pay. */
  async findUnrequested(eventId: string): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where: {
        eventId,
        status: 'ACCEPTED',
        amountDue: { gt: 0 },
        paymentRequestedAt: null,
      },
    });
  }

  /** Whether accepted registrations are asked to pay yet. */
  requestsOpen(
    settings: PaymentSettings,
    event: Pick<Event, 'startAt' | 'timezone'>,
    now = new Date(),
  ): boolean {
    return paymentRequestsOpen(
      settings,
      {
        startAt: utcCarrierToNaiveDateTime(event.startAt),
        timezone: event.timezone,
      },
      now,
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
    if (
      !this.mayPayYet(await this.getSettings(event.id), event, registration)
    ) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This registration cannot be paid yet',
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
        ...payerSnapshot(registration),
      },
    });

    const name = [registration.firstName, registration.lastName]
      .filter(Boolean)
      .join(' ');
    const eventName = translate(event.name, registration.locale) ?? '';

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
        await this.markRequested(registration);
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
   * Sets what a registration owes. `adjusted` marks a manager's fixed amount;
   * without it, `amountDue` is the quote again.
   */
  async setAmountDue(
    registration: Pick<Registration, 'id'>,
    data: { amountDue: number | null; adjusted: boolean; note: string | null },
  ): Promise<Registration> {
    return this.transaction(async (tx) => {
      const updated = await tx.registration.update({
        where: { id: registration.id },
        data: {
          amountDue: data.amountDue,
          amountDueAdjustedAt: data.adjusted ? new Date() : null,
          amountDueNote: data.adjusted ? data.note : null,
        },
      });
      await this.audit.record(
        paymentAuditEntry(
          updated,
          data.adjusted ? 'amount_due_adjusted' : 'amount_due_reset',
          { amountDue: data.amountDue },
        ),
      );
      return updated;
    });
  }

  /**
   * Lowers what a registration owes by a refund, as a manager's adjustment
   * with the refund's reason. Returns the previous state, to undo it.
   */
  private async reduceAmountDue(
    tx: Prisma.TransactionClient,
    registrationId: string,
    amount: number,
    reason: string | null,
  ): Promise<AmountDueBefore | null> {
    const registration = await tx.registration.findUniqueOrThrow({
      where: { id: registrationId },
    });
    if (registration.amountDue === null) {
      return null;
    }

    const amountDue = Math.max(0, registration.amountDue - amount);
    await tx.registration.update({
      where: { id: registrationId },
      data: {
        amountDue,
        amountDueAdjustedAt: new Date(),
        amountDueNote: reason ?? registration.amountDueNote,
      },
    });
    await this.audit.record(
      paymentAuditEntry(registration, 'amount_due_adjusted', { amountDue }),
    );

    return {
      registrationId,
      amountDue: registration.amountDue,
      amountDueAdjustedAt: registration.amountDueAdjustedAt,
      amountDueNote: registration.amountDueNote,
    };
  }

  private async restoreAmountDue(before: AmountDueBefore): Promise<void> {
    const { registrationId, ...data } = before;
    await this.prisma.registration.update({
      where: { id: registrationId },
      data,
    });
  }

  /**
   * Settles money a registration still holds before it is deleted, inside the
   * deletion's transaction. Without anything held nothing is required; with
   * money held, `settlement` decides: `retained` keeps it (e.g. a
   * cancellation fee), `settled_outside` books the rest as refunded outside
   * the app. The payments stay either way, with their payer snapshot.
   */
  async settleForDeletion(
    registration: Registration,
    settlement: PaymentSettlement | undefined,
    userId: string | null,
  ): Promise<PaymentSettlement | null> {
    const payments = await this.db.payment.findMany({
      where: { registrationId: registration.id, status: 'PAID' },
      include: { refunds: true },
    });
    const held = payments.filter((payment) => refundableAmount(payment) > 0);
    if (held.length === 0) {
      return null;
    }
    if (!settlement) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This registration still holds money; settle it before deleting',
        { code: 'PAYMENT_SETTLEMENT_REQUIRED' },
      );
    }

    for (const payment of held) {
      if (settlement === 'settled_outside') {
        const amount = refundableAmount(payment);
        await this.db.paymentRefund.create({
          data: {
            paymentId: payment.id,
            amount,
            reason: null,
            notifyParticipant: false,
            createdById: userId,
            status: 'REFUNDED',
            refundedAt: new Date(),
          },
        });
        await this.audit.record(
          paymentAuditEntry(registration, 'payment_refunded', { amount }),
        );
      }
      await this.db.payment.update({
        where: { id: payment.id },
        data: { settlement },
      });
    }

    return settlement;
  }

  /**
   * Removes the payer name of payments whose registration is gone, once the
   * accounting retention period has passed. Amounts and dates stay.
   */
  async anonymizeExpiredPayers(now = new Date()): Promise<number> {
    const cutoff = new Date(now);
    cutoff.setFullYear(
      cutoff.getFullYear() - config.payment.recordRetentionYears,
    );

    const { count } = await this.prisma.payment.updateMany({
      where: {
        registrationId: null,
        createdAt: { lt: cutoff },
        OR: [{ payerName: { not: null } }, { registrationRef: { not: null } }],
      },
      data: { payerName: null, registrationRef: null },
    });

    return count;
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
    return this.transaction(async (tx) => {
      const payment = await tx.payment.create({
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
          ...payerSnapshot(registration),
        },
        include: paymentInclude,
      });
      await this.audit.record(
        paymentAuditEntry(registration, 'payment_recorded', {
          amount: payment.amount,
        }),
      );
      return payment;
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

    await this.transaction(async (tx) => {
      await tx.payment.delete({ where: { id: payment.id } });
      if (payment.registrationId) {
        await this.audit.record(
          paymentAuditEntry(
            { id: payment.registrationId, eventId: payment.eventId },
            'payment_deleted',
            { amount: payment.amount },
          ),
        );
      }
    });
  }

  /**
   * Gives money back. The limit check and the PENDING row are one
   * serializable transaction, so concurrent refunds can never exceed what
   * was paid; the provider is called only after it committed. A manual
   * payment's refund, or one given back outside the app, is recorded as
   * already done.
   */
  async refund(
    event: Event,
    paymentId: string,
    data: {
      amount: number;
      reason: string | null;
      notifyParticipant: boolean;
      outsideApp: boolean;
      reduceAmountDue: boolean;
    },
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
    if (payment.source !== 'manual' && !data.outsideApp) {
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

    // What the registration owed before, restored should the provider refuse.
    const { refund, reduction } = await this.transaction(
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
        if (current.registrationId) {
          await this.audit.record(
            paymentAuditEntry(
              { id: current.registrationId, eventId: current.eventId },
              'payment_refunded',
              { amount: data.amount },
            ),
          );
        }
        const reduction =
          current.registrationId && data.reduceAmountDue
            ? await this.reduceAmountDue(
                tx,
                current.registrationId,
                data.amount,
                data.reason,
              )
            : null;
        return { refund: created, reduction };
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
        if (reduction) {
          await this.restoreAmountDue(reduction);
        }

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
   * Accepted registrations owing money that were never asked to pay, for
   * events whose request date has come — `DATE` and `BEFORE_START` timing.
   */
  async findDueRequests(now = new Date()) {
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
      if (
        !data.enabled ||
        (data.timing !== 'DATE' && data.timing !== 'BEFORE_START')
      ) {
        continue;
      }

      const registrations = await this.prisma.registration.findMany({
        where: {
          eventId: setting.eventId,
          status: 'ACCEPTED',
          amountDue: { gt: 0 },
          paymentRequestedAt: null,
        },
        include: { event: true },
      });

      for (const { event, ...registration } of registrations) {
        if (this.requestsOpen(data, event, now)) {
          due.push({ event, registration });
        }
      }
    }

    return due;
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
