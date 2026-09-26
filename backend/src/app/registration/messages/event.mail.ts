import type { Event, Registration } from '#generated/prisma/client.js';
import logger from '#core/logger';
import type { RegistrationChange } from '../registration.changes.js';
import {
  RegistrationTemplateMessage,
  type RegistrationTemplatePayload,
} from './template.mail.js';
import {
  loadMessageTemplate,
  templateToRenderable,
} from './renderable-message.js';

/**
 * Sent automatically for a lifecycle trigger, rendered from the
 * `MessageTemplate` the event configured for it — as opposed to an ad-hoc
 * manager-authored `Message`. One subclass per trigger.
 */
export class RegistrationEventMessage extends RegistrationTemplateMessage {
  static readonly trigger: string;
  static readonly type: string;

  static async enqueueFor(
    this: typeof RegistrationEventMessage,
    event: Event,
    registration: Registration,
    changes?: RegistrationChange[],
  ): Promise<void> {
    const payloads = await this.payloadsFor(event, registration, changes);

    await this.enqueueMany(payloads);
  }

  static async sendFor(
    this: typeof RegistrationEventMessage,
    event: Event,
    registration: Registration,
    changes?: RegistrationChange[],
  ): Promise<void> {
    const payloads = await this.payloadsFor(event, registration, changes);

    await this.sendMany(payloads);
  }

  private static async payloadsFor(
    this: typeof RegistrationEventMessage,
    event: Event,
    registration: Registration,
    changes?: RegistrationChange[],
  ): Promise<RegistrationTemplatePayload[]> {
    const messageTemplate = await loadMessageTemplate(
      event,
      this.trigger,
      registration.country,
    );
    if (!messageTemplate) {
      logger.debug(
        `No message template for trigger ${this.trigger} and event ${event.id}`,
      );
      return [];
    }

    return (
      this.prepareForRegistration(
        event,
        registration,
        templateToRenderable(messageTemplate),
        changes,
      ) ?? []
    );
  }
}
