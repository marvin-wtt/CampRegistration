import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import type {
  Event,
  Prisma,
  Registration,
  RegistrationStatus,
} from '#generated/prisma/client.js';
import type { RegistrationCreatePaymentMeta } from '@camp-registration/common/entities';
import type { PaymentSettings } from '@camp-registration/common/settings';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import {
  registrationPayment,
  utcCarrierToNaiveDateTime,
  zonedInstant,
} from '@camp-registration/common/utils';
import { BaseService } from '#core/base/BaseService';
import logger from '#core/logger';
import ApiError from '#core/router/ApiError';
import { describeError } from '#utils/errors';
import {
  balanceSelect,
  type EventWithOrganization,
  type PaymentCollection,
  PaymentService,
  paymentSettings,
} from './payment.service.js';
import { PaymentRequestedMessage } from './messages/requested.mail.js';
import { PaymentReminderMessage } from './messages/reminder.mail.js';
import { paymentPageUrl } from './payment-link.js';

export interface DuePayment {
  event: EventWithOrganization;
  registration: Registration;
}

type RegistrationWithBalance = Registration & {
  payments: Prisma.PaymentGetPayload<{ select: typeof balanceSelect }>[];
};

/**
 * Who may be asked automatically, as a query: accepted, something due, and
 * not on hold. Whether they still owe it after payments is `stillOwing`.
 */
const askable = {
  status: 'ACCEPTED',
  amountDue: { gt: 0 },
  paymentHoldAt: null,
} satisfies Prisma.RegistrationWhereInput;

function stillOwing(
  currency: string,
  { amountDue, payments }: RegistrationWithBalance,
): boolean {
  return registrationPayment(amountDue, currency, payments).outstanding > 0;
}

function withoutPayments({
  payments: _,
  ...registration
}: RegistrationWithBalance): Registration {
  return registration;
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
 * Asking registrations to pay — on acceptance, by a manager, by the daily
 * job — and reminding them. The one place that decides whether someone may
 * be asked: accepted, still owing money, not on hold, and the event
 * collecting payments.
 */
@injectable()
export class PaymentCollectionService extends BaseService {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
  ) {
    super();
  }

  private async owes(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<boolean> {
    if (!registration.amountDue) {
      return false;
    }
    const balance = await this.paymentService.getBalance(
      registration,
      event.currency,
    );
    return balance.outstanding > 0;
  }

  private assertCollecting(
    collection: PaymentCollection,
    event: EventWithOrganization,
  ): void {
    if (!this.paymentService.isCollecting(collection, event)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Payment requests are not due for this event',
        { code: 'PAYMENT_REQUESTS_CLOSED' },
      );
    }
  }

  // Not in one transaction with the mark: a queue that sends at once logs
  // the message against the registration row the mark would hold. Enqueue
  // failures are logged, never thrown.
  private async send(
    event: EventWithOrganization,
    registration: Registration,
    options?: { release?: boolean },
  ): Promise<void> {
    await PaymentRequestedMessage.enqueueFor(event, registration);
    await this.paymentService.markRequested(registration, options);
  }

  /**
   * Asks a registration that was just accepted, unless it was asked before
   * or is on hold. Before a date-based timing's request date, the daily job
   * asks later. Returns whether it asked.
   */
  async requestOnAcceptance(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<boolean> {
    if (
      registration.status !== 'ACCEPTED' ||
      registration.paymentRequestedAt ||
      registration.paymentHoldAt ||
      !(await this.owes(event, registration))
    ) {
      return false;
    }
    const collection = await this.paymentService.getCollection(event);
    if (!this.paymentService.isCollecting(collection, event)) {
      return false;
    }

    await this.send(event, registration);
    return true;
  }

  /**
   * A manager's (re-)request, with the reason when it cannot be sent. Being
   * a manager's decision, it lifts a hold.
   */
  async request(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<void> {
    if (!(await this.owes(event, registration))) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This registration does not owe a payment',
        { code: 'PAYMENT_NOTHING_DUE' },
      );
    }
    if (registration.status !== 'ACCEPTED') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Only accepted registrations are asked to pay',
        { code: 'PAYMENT_NOT_ACCEPTED' },
      );
    }
    this.assertCollecting(
      await this.paymentService.getCollection(event),
      event,
    );

    await this.send(event, registration, { release: true });
  }

  /** Accepted registrations still owing money that were never asked to pay. */
  async findUnrequested(
    event: Pick<Event, 'id' | 'currency'>,
  ): Promise<Registration[]> {
    const registrations = await this.prisma.registration.findMany({
      where: { ...askable, eventId: event.id, paymentRequestedAt: null },
      include: { payments: { select: balanceSelect } },
    });

    return registrations
      .filter((registration) => stillOwing(event.currency, registration))
      .map(withoutPayments);
  }

  /**
   * Asks every accepted registration that owes money and was never asked —
   * e.g. after payments were turned on with registrations already in.
   */
  async requestAll(event: EventWithOrganization): Promise<number> {
    this.assertCollecting(
      await this.paymentService.getCollection(event),
      event,
    );

    const registrations = await this.findUnrequested(event);
    for (const registration of registrations) {
      await this.send(event, registration);
    }

    return registrations.length;
  }

  /**
   * A registration accepted on submit (automatic confirmation) is asked to
   * pay at once and gets a checkout to be redirected to. Never fails the
   * registration itself — the participant can still pay later through the
   * payment page, whose link the request mail carries.
   */
  async forNewRegistration(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<RegistrationCreatePaymentMeta | null> {
    if (!registration.amountDue) {
      return null;
    }
    const settings = await this.paymentService.getSettings(event.id);
    if (!settings.enabled) {
      return null;
    }

    const pageUrl = paymentPageUrl(event.id, registration.id);
    if (!(await this.requestOnAcceptance(event, registration))) {
      return { checkoutUrl: null, pageUrl };
    }

    try {
      const { checkoutUrl } = await this.paymentService.startCheckout(
        event,
        registration,
      );
      return { checkoutUrl, pageUrl };
    } catch (error) {
      logger.warn(
        `Could not open a checkout for registration ${registration.id}: ${describeError(error)}`,
      );
      return { checkoutUrl: null, pageUrl };
    }
  }

  /**
   * Follows a status change: an accepted registration is asked to pay
   * (unless `notify` is off), and one no longer accepted can't pay its open
   * checkouts any more.
   */
  async statusChanged(
    event: EventWithOrganization,
    previous: RegistrationStatus,
    registration: Registration,
    { notify }: { notify: boolean },
  ): Promise<void> {
    if (previous === registration.status) {
      return;
    }
    if (registration.status === 'ACCEPTED') {
      if (notify) {
        await this.requestOnAcceptance(event, registration);
      }
    } else if (previous === 'ACCEPTED') {
      await this.paymentService.closeStaleCheckouts(event, registration, 0);
    }
  }

  /** The daily job's date-based requests. */
  async sendDueRequests(now = new Date()): Promise<number> {
    return this.sendEach(
      await this.findDueRequests(now),
      'request',
      ({ event, registration }) => this.send(event, registration),
    );
  }

  async sendDueReminders(now = new Date()): Promise<number> {
    return this.sendEach(
      await this.findDueReminders(now),
      'reminder',
      async ({ event, registration }) => {
        await PaymentReminderMessage.enqueueFor(event, registration);
        await this.paymentService.markReminded(registration.id);
      },
    );
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
        ...askable,
        eventId: { in: events.map(({ event }) => event.id) },
        paymentRequestedAt: null,
      },
      include: { payments: { select: balanceSelect } },
    });

    return this.pairOwing(events, registrations);
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
        ...askable,
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

    return this.pairOwing(events, registrations);
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
      .filter(({ event, settings }) => include(settings, event));
    if (candidates.length === 0) {
      return [];
    }

    const accounts = await this.prisma.paymentAccount.findMany({
      where: {
        activeOrganizationId: {
          in: [...new Set(candidates.map(({ event }) => event.organizationId))],
        },
      },
      select: { organizationId: true },
    });
    const connected = new Set(accounts.map((a) => a.organizationId));

    return candidates.filter(({ event, settings }) =>
      this.paymentService.isCollecting(
        {
          settings,
          organizationVerified:
            event.organization.verificationStatus === 'VERIFIED',
          accountConnected: connected.has(event.organizationId),
        },
        event,
        now,
      ),
    );
  }

  /** Keeps the registrations that still owe money, paired with their event. */
  private pairOwing(
    events: { event: EventWithOrganization }[],
    registrations: RegistrationWithBalance[],
  ): DuePayment[] {
    const byId = new Map(events.map(({ event }) => [event.id, event]));

    return registrations.flatMap((registration) => {
      const event = byId.get(registration.eventId);
      return event && stillOwing(event.currency, registration)
        ? [{ event, registration: withoutPayments(registration) }]
        : [];
    });
  }

  private async sendEach(
    due: DuePayment[],
    kind: string,
    send: (due: DuePayment) => Promise<void>,
  ): Promise<number> {
    let sent = 0;
    for (const item of due) {
      try {
        await send(item);
        sent++;
      } catch (error) {
        logger.error(
          `Failed to send payment ${kind} for registration ${item.registration.id}: ${describeError(error)}`,
        );
      }
    }

    if (sent > 0) {
      logger.info(`Sent ${sent.toString()} payment ${kind}(s)`);
    }

    return sent;
  }
}
