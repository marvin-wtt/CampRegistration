import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import type {
  Registration,
  RegistrationStatus,
} from '#generated/prisma/client.js';
import type { RegistrationCreatePaymentMeta } from '@camp-registration/common/entities';
import logger from '#core/logger';
import ApiError from '#utils/ApiError';
import { describeError } from '#utils/errors';
import {
  type DuePayment,
  type EventWithOrganization,
  type PaymentCollection,
  PaymentService,
} from './payment.service.js';
import { PaymentRequestedMessage } from './messages/requested.mail.js';
import { PaymentReminderMessage } from './messages/reminder.mail.js';
import { paymentPageUrl } from './payment-link.js';

/**
 * Asking registrations to pay — on acceptance, by a manager, by the daily
 * job — and reminding them. The one place that decides whether someone may
 * be asked: accepted, still owing money, and the event collecting payments.
 */
@injectable()
export class PaymentCollectionService {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
  ) {}

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

  private mayAsk(
    collection: PaymentCollection,
    event: EventWithOrganization,
    registration: Registration,
  ): boolean {
    return (
      registration.status === 'ACCEPTED' &&
      this.paymentService.isCollecting(collection, event)
    );
  }

  // Not in one transaction with the mark: a queue that sends at once logs
  // the message against the registration row the mark would hold. Enqueue
  // failures are logged, never thrown.
  private async send(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<void> {
    await PaymentRequestedMessage.enqueueFor(event, registration);
    await this.paymentService.markRequested(registration);
  }

  /**
   * Asks a registration that was just accepted, unless it was asked before.
   * Before a date-based timing's request date, the daily job asks later.
   * Returns whether it asked.
   */
  async requestOnAcceptance(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<boolean> {
    if (
      registration.paymentRequestedAt ||
      !(await this.owes(event, registration))
    ) {
      return false;
    }
    const collection = await this.paymentService.getCollection(event);
    if (!this.mayAsk(collection, event, registration)) {
      return false;
    }

    await this.send(event, registration);
    return true;
  }

  /** A manager's (re-)request, with the reason when it cannot be sent. */
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
    const collection = await this.paymentService.getCollection(event);
    if (!this.paymentService.isCollecting(collection, event)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Payment requests are not due for this event',
        { code: 'PAYMENT_REQUESTS_CLOSED' },
      );
    }

    await this.send(event, registration);
  }

  /**
   * Asks every accepted registration that owes money and was never asked —
   * e.g. after payments were turned on with registrations already in.
   */
  async requestAll(event: EventWithOrganization): Promise<number> {
    const collection = await this.paymentService.getCollection(event);
    if (!this.paymentService.isCollecting(collection, event)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Payment requests are not due for this event',
        { code: 'PAYMENT_REQUESTS_CLOSED' },
      );
    }

    const registrations = await this.paymentService.findUnrequested(event);
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
      await this.paymentService.findDueRequests(now),
      'request',
      ({ event, registration }) => this.send(event, registration),
    );
  }

  async sendDueReminders(now = new Date()): Promise<number> {
    return this.sendEach(
      await this.paymentService.findDueReminders(now),
      'reminder',
      async ({ event, registration }) => {
        await PaymentReminderMessage.enqueueFor(event, registration);
        await this.paymentService.markReminded(registration.id);
      },
    );
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
