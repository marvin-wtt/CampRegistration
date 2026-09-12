import type { Event, Registration } from '#generated/prisma/client.js';
import logger from '#core/logger';
import type { RegistrationChange } from '../registration.changes.js';
import { RegistrationTemplateMessage } from './template.mail.js';
import {
  loadMessageTemplate,
  templateToRenderable,
} from './renderable-message.js';

/**
 * A `RegistrationTemplateMessage` sent automatically for an event lifecycle
 * trigger (registration submitted/confirmed/etc), rendered from whichever
 * `MessageTemplate` the event has configured for that trigger — as opposed
 * to an ad-hoc manager-authored `Message`. Extended by one file per trigger
 * (submitted.mail.ts, confirmed.mail.ts, waitlisted.mail.ts, updated.mail.ts,
 * deleted.mail.ts, accepted.mail.ts).
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
    const messageTemplate = await loadMessageTemplate(
      event,
      this.trigger,
      registration.country,
    );
    if (!messageTemplate) {
      logger.debug(
        `No message template for event type ${this.trigger} and event ${event.id}`,
      );
      return;
    }

    const payload = this.prepareForRegistration(
      event,
      registration,
      templateToRenderable(messageTemplate),
      changes,
    );

    if (!payload) {
      return;
    }

    await this.enqueueMany(payload);
  }

  static async sendFor(
    this: typeof RegistrationEventMessage,
    event: Event,
    registration: Registration,
    changes?: RegistrationChange[],
  ): Promise<void> {
    const messageTemplate = await loadMessageTemplate(
      event,
      this.trigger,
      registration.country,
    );
    if (!messageTemplate) {
      return;
    }

    const payload = this.prepareForRegistration(
      event,
      registration,
      templateToRenderable(messageTemplate),
      changes,
    );

    if (!payload) {
      return;
    }

    await this.sendMany(payload);
  }
}
