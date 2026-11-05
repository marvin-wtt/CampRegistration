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
  outstandingAmount,
  overpaidAmount,
  paymentRequestsOpen,
  refundableAmount,
  registrationPayment,
  translate,
  utcCarrierToNaiveDateTime,
  zonedInstant,
} from '@camp-registration/common/utils';
import { BaseService } from '#core/base/BaseService';
import logger from '#core/logger';
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
import { paymentPageUrl } from './payment-link.js';
import { retentionCutoff } from './payment.retention.js';

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  enabled: false,
  timing: 'ACCEPTANCE',
  requestDate: null,
  requestDaysBeforeStart: null,
  reminderAfterDays: null,
};

/** A stored `payment` setting, completed with the defaults. */
export function paymentSettings(data: unknown): PaymentSettings {
  return {
    ...DEFAULT_PAYMENT_SETTINGS,
    ...(data as Partial<PaymentSettings> | null | undefined),
  };
}

// A checkout closer than this to expiring is not handed out again.
const CHECKOUT_REUSE_MARGIN_MS = 5 * 60 * 1000;
// Holds the registration's row lock across the provider call.
const CHECKOUT_TRANSACTION_TIMEOUT_MS = 30_000;

const paymentInclude = {
  refunds: {
    orderBy: { createdAt: 'asc' },
    include: { createdBy: { select: { name: true } } },
  },
  createdBy: { select: { name: true } },
} satisfies Prisma.PaymentInclude;

const balanceSelect = {
  status: true,
  amount: true,
  refunds: { select: { status: true, amount: true } },
} satisfies Prisma.PaymentSelect;

export type PaymentWithDetails = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;

export type EventWithOrganization = Event & {
  organization: Pick<Organization, 'verificationStatus'>;
};

/** Whether an event can take payments: its settings, and somewhere to pay to. */
export interface PaymentCollection {
  settings: PaymentSettings;
  /** The organization is verified and has connected a provider. */
  accountReady: boolean;
}

export interface DuePayment {
  event: EventWithOrganization;
  registration: Registration;
}

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

function eventEnded(
  event: Pick<Event, 'endAt' | 'timezone'>,
  now: Date,
): boolean {
  return (
    zonedInstant(utcCarrierToNaiveDateTime(event.endAt), event.timezone) <= now
  );
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
    @inject(AuditService) private readonly audit: AuditService,
  ) {
    super();
  }

  async getSettings(eventId: string): Promise<PaymentSettings> {
    const setting = await this.settingService.getSetting(
      eventId,
      SETTING_KEYS.PAYMENT,
    );

    return paymentSettings(setting?.data);
  }

  async getCollection(
    event: EventWithOrganization,
  ): Promise<PaymentCollection> {
    const [settings, account] = await Promise.all([
      this.getSettings(event.id),
      this.accountService.getByOrganization(event.organizationId),
    ]);

    return {
      settings,
      accountReady:
        account !== null &&
        event.organization.verificationStatus === 'VERIFIED',
    };
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

  /** Whether the event takes payments from its accepted registrations now. */
  isCollecting(
    collection: PaymentCollection,
    event: Pick<Event, 'startAt' | 'timezone'>,
    now = new Date(),
  ): boolean {
    return (
      collection.settings.enabled &&
      collection.accountReady &&
      this.requestsOpen(collection.settings, event, now)
    );
  }

  async getBalance(
    registration: Pick<Registration, 'id' | 'amountDue'>,
    currency: string,
  ): Promise<RegistrationPayment> {
    const payments = await this.db.payment.findMany({
      where: { registrationId: registration.id },
      select: balanceSelect,
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

  async markReminded(registrationId: string): Promise<void> {
    await this.db.registration.update({
      where: { id: registrationId },
      data: { paymentReminderSentAt: new Date() },
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
    const collection = await this.getCollection(event);

    return {
      ...balance,
      registrationId: registration.id,
      eventId: event.id,
      latestPaymentStatus: latest?.status ?? null,
      payable:
        balance.outstanding > 0 &&
        registration.status === 'ACCEPTED' &&
        this.isCollecting(collection, event),
    };
  }

  /** Accepted registrations still owing money that were never asked to pay. */
  async findUnrequested(
    event: Pick<Event, 'id' | 'currency'>,
  ): Promise<Registration[]> {
    const registrations = await this.prisma.registration.findMany({
      where: {
        eventId: event.id,
        status: 'ACCEPTED',
        amountDue: { gt: 0 },
        paymentRequestedAt: null,
      },
      include: { payments: { select: balanceSelect } },
    });

    return registrations
      .filter(
        ({ amountDue, payments }) =>
          registrationPayment(amountDue, event.currency, payments).outstanding >
          0,
      )
      .map(({ payments: _, ...registration }) => registration);
  }

  /**
   * Opens (or reuses) a provider checkout for the outstanding balance.
   * Refuses — rather than failing later at the provider — when there is
   * nothing to pay or nowhere to pay it to. The registration's row stays
   * locked until the checkout is stored, so concurrent calls share one.
   */
  async startCheckout(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<{ checkoutUrl: string; payment: Payment }> {
    if (registration.status !== 'ACCEPTED') {
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
    const settings = await this.getSettings(event.id);
    if (!settings.enabled || !this.requestsOpen(settings, event)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This registration cannot be paid yet',
        { code: 'PAYMENT_NOT_ACCEPTED' },
      );
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

    return this.transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM registrations WHERE id = ${registration.id} FOR UPDATE`;

        const balance = await this.getBalance(registration, event.currency);
        const amount = outstandingAmount(balance);
        if (amount <= 0) {
          throw new ApiError(httpStatus.CONFLICT, 'Nothing is due', {
            code: 'PAYMENT_NOTHING_DUE',
          });
        }

        const reusable = await tx.payment.findFirst({
          where: {
            registrationId: registration.id,
            source: resolved.account.provider,
            status: 'OPEN',
            amount,
            checkoutUrl: { not: null },
            OR: [
              { expiresAt: null },
              {
                expiresAt: {
                  gt: new Date(Date.now() + CHECKOUT_REUSE_MARGIN_MS),
                },
              },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });
        if (reusable?.checkoutUrl) {
          return { checkoutUrl: reusable.checkoutUrl, payment: reusable };
        }

        // The new checkout replaces any other: both paid would be too much.
        await this.closeStaleCheckouts(event, registration, 0);

        return this.createCheckout(event, registration, resolved, amount);
      },
      { timeout: CHECKOUT_TRANSACTION_TIMEOUT_MS },
    );
  }

  /**
   * Cancels a registration's open checkouts that would now pay more than it
   * owes (more than `limit`, by default what is outstanding). Best effort: a
   * checkout the provider refuses to cancel can still be paid, and then shows
   * as an overpayment.
   */
  async closeStaleCheckouts(
    event: Pick<Event, 'organizationId' | 'currency'>,
    registration: Pick<Registration, 'id' | 'amountDue'>,
    limit?: number,
  ): Promise<void> {
    const max =
      limit ??
      outstandingAmount(await this.getBalance(registration, event.currency));
    const stale = await this.db.payment.findMany({
      where: {
        registrationId: registration.id,
        status: 'OPEN',
        providerPaymentId: { not: null },
        amount: { gt: max },
      },
    });
    if (stale.length === 0) {
      return;
    }

    const resolved = await this.accountService.resolveForOrganization(
      event.organizationId,
    );
    for (const payment of stale) {
      if (!payment.providerPaymentId) {
        continue;
      }
      if (resolved?.account.provider !== payment.source) {
        logger.warn(
          `Cannot cancel ${payment.source} checkout ${payment.id}: the organization's account changed`,
        );
        continue;
      }
      try {
        await resolved.provider.cancelCheckout(
          resolved.credentials,
          payment.providerPaymentId,
        );
        // Never handed out again; the status follows with the next re-fetch.
        await this.db.payment.updateMany({
          where: { id: payment.id, status: 'OPEN' },
          data: { checkoutUrl: null },
        });
      } catch (error) {
        logger.warn(
          `Could not cancel checkout ${payment.id}: ${describeError(error)}`,
        );
      }
    }
  }

  /** Inside `startCheckout`'s transaction: a provider failure rolls the row back. */
  private async createCheckout(
    event: Event,
    registration: Registration,
    { account, provider, credentials }: ResolvedPaymentAccount,
    amount: number,
  ): Promise<{ checkoutUrl: string; payment: Payment }> {
    // The row exists first, so its id can be the provider-side reference.
    const pending = await this.db.payment.create({
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

    let checkout;
    try {
      checkout = await provider.createCheckout(credentials, {
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
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        'The payment provider could not start a checkout',
        { cause: error, fault: false, code: 'PAYMENT_PROVIDER_ERROR' },
      );
    }

    try {
      const payment = await this.db.payment.update({
        where: { id: pending.id },
        data: {
          providerPaymentId: checkout.providerPaymentId,
          checkoutUrl: checkout.checkoutUrl,
          expiresAt: checkout.expiresAt,
        },
      });

      return { checkoutUrl: checkout.checkoutUrl, payment };
    } catch (error) {
      // The ledger would never learn of it: it must not stay payable.
      await provider
        .cancelCheckout(credentials, checkout.providerPaymentId)
        .catch((cancelError: unknown) => {
          logger.error(
            `Orphaned ${account.provider} checkout ${checkout.providerPaymentId}: ${describeError(cancelError)}`,
          );
        });
      throw error;
    }
  }

  /**
   * Sets what a registration owes. `adjusted` marks a manager's fixed amount;
   * without it, `amountDue` is the quote again.
   */
  async setAmountDue(
    event: Pick<Event, 'organizationId' | 'currency'>,
    registration: Pick<Registration, 'id'>,
    data: { amountDue: number | null; adjusted: boolean; note: string | null },
  ): Promise<Registration> {
    const updated = await this.transaction(async (tx) => {
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
    await this.closeStaleCheckouts(event, updated);

    return updated;
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
   * accounting retention period has passed for the payment and all of its
   * refunds. Amounts and dates stay.
   */
  async anonymizeExpiredPayers(now = new Date()): Promise<number> {
    const cutoff = retentionCutoff(now);

    const { count } = await this.prisma.payment.updateMany({
      where: {
        registrationId: null,
        createdAt: { lt: cutoff },
        refunds: { none: { createdAt: { gte: cutoff } } },
        OR: [{ payerName: { not: null } }, { registrationRef: { not: null } }],
      },
      data: { payerName: null, registrationRef: null },
    });

    return count;
  }

  /**
   * Whether the event's currency is fixed: stored amounts are minor units of
   * it, so changing it after anything was quoted or paid would change their
   * value.
   */
  async isCurrencyLocked(eventId: string): Promise<boolean> {
    const [payments, quoted] = await Promise.all([
      this.prisma.payment.count({ where: { eventId } }),
      this.prisma.registration.count({
        where: { eventId, quotedAmount: { gt: 0 } },
      }),
    ]);

    return payments > 0 || quoted > 0;
  }

  /**
   * Clears an event's ledger inside its deletion's transaction. Money that
   * changed hands keeps its record until the retention period has passed;
   * attempts that never settled carry no money and go with the event.
   */
  async releaseEventLedger(eventId: string, now = new Date()): Promise<void> {
    const cutoff = retentionCutoff(now);
    const kept = await this.db.payment.count({
      where: {
        eventId,
        status: 'PAID',
        OR: [
          { createdAt: { gte: cutoff } },
          { refunds: { some: { createdAt: { gte: cutoff } } } },
        ],
      },
    });
    if (kept > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This event has received payments that must be kept for accounting',
        { code: 'EVENT_HAS_PAYMENTS' },
      );
    }

    await this.db.paymentRefund.deleteMany({ where: { payment: { eventId } } });
    await this.db.payment.deleteMany({ where: { eventId } });
  }

  /** Records money received outside the app (bank transfer, cash). */
  async createManualPayment(
    event: Event,
    registration: Registration,
    data: {
      /** Minor units. */
      amount: number;
      paidAt?: Date;
      method?: string | null;
      note?: string | null;
    },
    userId: string,
  ): Promise<PaymentWithDetails> {
    const payment = await this.transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          eventId: event.id,
          source: 'manual',
          status: 'PAID',
          amount: data.amount,
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
    await this.closeStaleCheckouts(event, registration);

    return payment;
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
   * was paid; the provider is called only after it committed, and the
   * refund is audited only once the provider took it. A manual payment's
   * refund, or one given back outside the app, is recorded as already done.
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

    const refund = await this.transaction(
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
          if (count === 1 && result.status !== 'REFUNDED') {
            await this.restoreAmountDue(refund);
          }
        }
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

    const stored = await this.prisma.paymentRefund.findUniqueOrThrow({
      where: { id: refund.id },
    });
    if (stored.status === 'PENDING' || stored.status === 'REFUNDED') {
      await this.recordRefund(stored);
    }

    return {
      refund: stored,
      payment: await this.prisma.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: paymentInclude,
      }),
      completedNow,
    };
  }

  /**
   * Events collecting payments now — verified, with a provider connected —
   * whose settings and event pass `include`.
   */
  private async collectingEvents(
    now: Date,
    include: (settings: PaymentSettings, event: Event) => boolean,
  ): Promise<{ event: EventWithOrganization; settings: PaymentSettings }[]> {
    const rows = await this.prisma.eventSetting.findMany({
      where: { key: SETTING_KEYS.PAYMENT },
      select: {
        data: true,
        event: {
          include: { organization: { select: { verificationStatus: true } } },
        },
      },
    });

    const candidates = rows
      .map(({ data, event }) => ({ event, settings: paymentSettings(data) }))
      .filter(
        ({ event, settings }) =>
          settings.enabled &&
          include(settings, event) &&
          event.organization.verificationStatus === 'VERIFIED' &&
          this.requestsOpen(settings, event, now),
      );
    if (candidates.length === 0) {
      return [];
    }

    const accounts = await this.prisma.paymentAccount.findMany({
      where: {
        organizationId: {
          in: [...new Set(candidates.map(({ event }) => event.organizationId))],
        },
      },
      select: { organizationId: true },
    });
    const connected = new Set(accounts.map((a) => a.organizationId));

    return candidates.filter(({ event }) =>
      connected.has(event.organizationId),
    );
  }

  /** Keeps the registrations that still owe money, paired with their event. */
  private withOutstanding(
    events: Map<string, EventWithOrganization>,
    registrations: (Registration & {
      payments: Prisma.PaymentGetPayload<{ select: typeof balanceSelect }>[];
    })[],
  ): DuePayment[] {
    return registrations.flatMap(({ payments, ...registration }) => {
      const event = events.get(registration.eventId);
      return event &&
        registrationPayment(registration.amountDue, event.currency, payments)
          .outstanding > 0
        ? [{ event, registration }]
        : [];
    });
  }

  /**
   * Accepted registrations owing money that were never asked to pay, for
   * events whose request date has come — `DATE` and `BEFORE_START` timing.
   */
  async findDueRequests(now = new Date()): Promise<DuePayment[]> {
    const events = await this.collectingEvents(
      now,
      (settings) =>
        settings.timing === 'DATE' || settings.timing === 'BEFORE_START',
    );
    if (events.length === 0) {
      return [];
    }

    const registrations = await this.prisma.registration.findMany({
      where: {
        eventId: { in: events.map(({ event }) => event.id) },
        status: 'ACCEPTED',
        amountDue: { gt: 0 },
        paymentRequestedAt: null,
      },
      include: { payments: { select: balanceSelect } },
    });

    return this.withOutstanding(
      new Map(events.map(({ event }) => [event.id, event])),
      registrations,
    );
  }

  /**
   * Accepted registrations still owing money, whose last request or reminder
   * is at least `reminderAfterDays` old, for events that enabled reminders
   * and have not ended yet — after that, reminding is the organizer's call.
   */
  async findDueReminders(now = new Date()): Promise<DuePayment[]> {
    const events = await this.collectingEvents(
      now,
      (settings, event) =>
        !!settings.reminderAfterDays && !eventEnded(event, now),
    );
    if (events.length === 0) {
      return [];
    }

    const registrations = await this.prisma.registration.findMany({
      where: {
        status: 'ACCEPTED',
        amountDue: { gt: 0 },
        OR: events.map(({ event, settings }) => {
          const cutoff = new Date(
            now.getTime() - (settings.reminderAfterDays ?? 0) * 86_400_000,
          );
          return {
            eventId: event.id,
            paymentRequestedAt: { lte: cutoff },
            OR: [
              { paymentReminderSentAt: null },
              { paymentReminderSentAt: { lte: cutoff } },
            ],
          };
        }),
      },
      include: { payments: { select: balanceSelect } },
    });

    return this.withOutstanding(
      new Map(events.map(({ event }) => [event.id, event])),
      registrations,
    );
  }
}
