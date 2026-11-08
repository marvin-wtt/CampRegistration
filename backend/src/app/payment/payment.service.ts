import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import {
  type Event,
  type Organization,
  type Payment,
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
  paymentRequestsOpen,
  refundableAmount,
  registrationPayment,
  translate,
  utcCarrierToNaiveDateTime,
} from '@camp-registration/common/utils';
import { BaseService } from '#core/base/BaseService';
import { afterCommit } from '#core/database/transaction';
import logger from '#core/logger';
import ApiError from '#core/router/ApiError';
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

export const paymentInclude = {
  refunds: {
    orderBy: { createdAt: 'asc' },
    include: { createdBy: { select: { name: true } } },
  },
  createdBy: { select: { name: true } },
} satisfies Prisma.PaymentInclude;

export const balanceSelect = {
  status: true,
  amount: true,
  refunds: { select: { status: true, amount: true, kind: true } },
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
  organizationVerified: boolean;
  accountConnected: boolean;
}

/** Why an event doesn't collect payments right now. */
export type CollectionBlocker =
  'disabled' | 'not_open' | 'unverified' | 'no_account';

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

/**
 * The payment ledger and its lifecycle, independent of any provider:
 * providers are reached only through `PaymentProvider`. Sends no mail and
 * emits nothing itself — callers act on the returned outcomes. Refunds live
 * in `PaymentRefundService`, asking people to pay in `PaymentCollectionService`.
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
      organizationVerified:
        event.organization.verificationStatus === 'VERIFIED',
      accountConnected: account !== null,
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

  /** The first reason the event doesn't take payments now, if any. */
  collectionBlocker(
    collection: PaymentCollection,
    event: Pick<Event, 'startAt' | 'timezone'>,
    now = new Date(),
  ): CollectionBlocker | null {
    if (!collection.settings.enabled) {
      return 'disabled';
    }
    if (!this.requestsOpen(collection.settings, event, now)) {
      return 'not_open';
    }
    if (!collection.organizationVerified) {
      return 'unverified';
    }
    if (!collection.accountConnected) {
      return 'no_account';
    }

    return null;
  }

  /** Whether the event takes payments from its accepted registrations now. */
  isCollecting(
    collection: PaymentCollection,
    event: Pick<Event, 'startAt' | 'timezone'>,
    now = new Date(),
  ): boolean {
    return this.collectionBlocker(collection, event, now) === null;
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

  /** `release` lifts a hold: a manager decided to ask anyway. */
  async markRequested(
    registration: Pick<Registration, 'id' | 'eventId'>,
    { release = false }: { release?: boolean } = {},
  ): Promise<void> {
    await this.transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          paymentRequestedAt: new Date(),
          ...(release && { paymentHoldAt: null }),
        },
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

  /**
   * Pauses automatic reminders and checkouts: money went back outside the
   * app, and whether it is still owed is for a manager to decide.
   */
  async holdPayments(registrationId: string): Promise<void> {
    await this.db.registration.updateMany({
      where: { id: registrationId, paymentHoldAt: null },
      data: { paymentHoldAt: new Date() },
    });
  }

  async releaseHold(registrationId: string): Promise<void> {
    await this.db.registration.updateMany({
      where: { id: registrationId, paymentHoldAt: { not: null } },
      data: { paymentHoldAt: null },
    });
  }

  /** The public view behind a registration's payment link. */
  async getSummary(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<RegistrationPaymentSummary> {
    const [balance, latest, collection] = await Promise.all([
      this.getBalance(registration, event.currency),
      this.prisma.payment.findFirst({
        where: { registrationId: registration.id, source: { not: 'manual' } },
        orderBy: { createdAt: 'desc' },
        select: { status: true },
      }),
      this.getCollection(event),
    ]);

    return {
      ...balance,
      registrationId: registration.id,
      eventId: event.id,
      latestPaymentStatus: latest?.status ?? null,
      payable:
        balance.outstanding > 0 &&
        registration.status === 'ACCEPTED' &&
        registration.paymentHoldAt === null &&
        this.isCollecting(collection, event),
    };
  }

  /**
   * Opens (or reuses) a provider checkout for the outstanding balance.
   * Refuses — rather than failing later at the provider — when there is
   * nothing to pay or nowhere to pay it to. The registration's row stays
   * locked until the checkout is stored, so concurrent calls share one.
   */
  async startCheckout(
    event: EventWithOrganization,
    registration: Pick<Registration, 'id'>,
  ): Promise<{ checkoutUrl: string; payment: Payment; created: boolean }> {
    const blocker = this.collectionBlocker(
      await this.getCollection(event),
      event,
    );
    if (blocker === 'unverified') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The organizer cannot accept payments yet',
        { code: 'PAYMENT_ORGANIZATION_UNVERIFIED' },
      );
    }
    if (blocker === 'disabled' || blocker === 'not_open') {
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
        // Read under the lock: what it owes may have changed meanwhile.
        const locked = await tx.registration.findUniqueOrThrow({
          where: { id: registration.id },
        });
        if (locked.status !== 'ACCEPTED') {
          throw new ApiError(
            httpStatus.CONFLICT,
            'This registration cannot be paid yet',
            { code: 'PAYMENT_NOT_ACCEPTED' },
          );
        }
        if (locked.paymentHoldAt) {
          throw new ApiError(
            httpStatus.CONFLICT,
            'The organizer is reviewing this payment',
            { code: 'PAYMENT_ON_HOLD' },
          );
        }

        const balance = await this.getBalance(locked, event.currency);
        const amount = outstandingAmount(balance);
        if (amount <= 0) {
          throw new ApiError(httpStatus.CONFLICT, 'Nothing is due', {
            code: 'PAYMENT_NOTHING_DUE',
          });
        }

        const reusable = await tx.payment.findFirst({
          where: {
            registrationId: locked.id,
            paymentAccountId: resolved.account.id,
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
          return {
            checkoutUrl: reusable.checkoutUrl,
            payment: reusable,
            created: false,
          };
        }

        // The new checkout replaces any other: both paid would be too much.
        await this.closeStaleCheckouts(event, locked, 0);

        return {
          ...(await this.createCheckout(event, locked, resolved, amount)),
          created: true,
        };
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
    await this.cancelCheckouts({
      registrationId: registration.id,
      amount: { gt: max },
    });
  }

  /**
   * Cancels the open provider checkouts matching `where`, each through the
   * account it was opened with. They are never handed out again at once; the
   * provider is called once the caller's transaction committed. Best effort:
   * a failure is logged, and the checkout then shows up as a payment if it
   * is paid after all.
   */
  private async cancelCheckouts(
    where: Prisma.PaymentWhereInput,
  ): Promise<void> {
    const open = await this.db.payment.findMany({
      where: { ...where, status: 'OPEN', providerPaymentId: { not: null } },
    });
    if (open.length === 0) {
      return;
    }

    // The status follows with the next re-fetch.
    await this.db.payment.updateMany({
      where: { id: { in: open.map(({ id }) => id) }, status: 'OPEN' },
      data: { checkoutUrl: null },
    });

    await afterCommit(async () => {
      for (const payment of open) {
        try {
          const resolved = await this.accountService.resolveForPayment(payment);
          if (resolved && payment.providerPaymentId) {
            await resolved.provider.cancelCheckout(
              resolved.credentials,
              payment.providerPaymentId,
            );
          }
        } catch (error) {
          logger.warn(
            `Could not cancel checkout ${payment.id}: ${describeError(error)}`,
          );
        }
      }
    });
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
        paymentAccountId: account.id,
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
   * without it, `amountDue` is the quote again. Either way a manager looked
   * at it, so a hold is lifted.
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
          paymentHoldAt: null,
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
   * Settles money a registration still holds before it is deleted, inside the
   * deletion's transaction, and closes its open checkouts — nothing may be
   * paid for it afterwards. Without anything held nothing is required; with
   * money held, `settlement` decides: `retained` keeps it (e.g. a
   * cancellation fee), `settled_outside` books the rest as refunded outside
   * the app. The payments stay either way, with their payer snapshot.
   */
  async settleForDeletion(
    event: Pick<Event, 'organizationId' | 'currency'>,
    registration: Registration,
    settlement: PaymentSettlement | undefined,
    actor: { userId: string | null; maySettle: boolean },
  ): Promise<PaymentSettlement | null> {
    const payments = await this.db.payment.findMany({
      where: { registrationId: registration.id, status: 'PAID' },
      include: { refunds: true },
    });
    const held = payments.filter((payment) => refundableAmount(payment) > 0);
    if (held.length > 0 && !settlement) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This registration still holds money; settle it before deleting',
        { code: 'PAYMENT_SETTLEMENT_REQUIRED' },
      );
    }
    // Keeping or booking back money is a refund decision.
    if (held.length > 0 && !actor.maySettle) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Settling the money this registration holds needs the refund permission',
        { code: 'PAYMENT_SETTLEMENT_FORBIDDEN' },
      );
    }

    await this.closeStaleCheckouts(event, registration, 0);
    if (held.length === 0 || !settlement) {
      return null;
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
            createdById: actor.userId,
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
   * attempts that never settled carry no money and go with the event — their
   * checkouts closed first, or one paid later would arrive unbooked.
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

    await this.cancelCheckouts({ eventId });
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
      // The money came back by other means: nothing left to review.
      await this.releaseHold(registration.id);
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
}
