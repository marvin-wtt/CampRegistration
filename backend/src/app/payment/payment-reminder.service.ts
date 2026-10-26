import { inject, injectable } from 'inversify';
import logger from '#core/logger';
import { describeError } from '#utils/errors';
import { PaymentService } from './payment.service.js';
import { PaymentReminderMessage } from './messages/reminder.mail.js';
import { PaymentRequestedMessage } from './messages/requested.mail.js';

/** The daily `payment-reminders` job, which also sends date-based requests. */
@injectable()
export class PaymentReminderService {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
  ) {}

  async sendDueRequests(now = new Date()): Promise<number> {
    const due = await this.paymentService.findDueRequests(now);

    let sent = 0;
    for (const { event, registration } of due) {
      try {
        await PaymentRequestedMessage.enqueueFor(event, registration);
        await this.paymentService.markRequested(registration);
        sent++;
      } catch (error) {
        logger.error(
          `Failed to send payment request for registration ${registration.id}: ${describeError(error)}`,
        );
      }
    }

    if (sent > 0) {
      logger.info(`Sent ${sent.toString()} payment request(s)`);
    }

    return sent;
  }

  async sendDueReminders(now = new Date()): Promise<number> {
    const due = await this.paymentService.findDueReminders(now);

    let sent = 0;
    for (const { event, registration } of due) {
      try {
        await PaymentReminderMessage.enqueueFor(event, registration);
        await this.paymentService.markReminded(registration.id);
        sent++;
      } catch (error) {
        logger.error(
          `Failed to send payment reminder for registration ${registration.id}: ${describeError(error)}`,
        );
      }
    }

    if (sent > 0) {
      logger.info(`Sent ${sent.toString()} payment reminder(s)`);
    }

    return sent;
  }
}
