import type {
  Event,
  MessageDelivery,
  Registration,
} from '#generated/prisma/client.js';
import { MailBase } from '#core/mail/mail.base';
import type { AddressLike, Content } from '#core/mail/mail.types';
import { objectValueOrAll } from '#utils/translateObject';
import { translateEventContext } from '#app/event/event.util';
import { generateUrl } from '#utils/url';

export interface MessageBouncedNotificationPayload {
  event: Event;
  registration: Registration;
  delivery: MessageDelivery;
}

/**
 * Notifies the event's contact email that a camp message bounced — mirrors
 * `RegistrationNotifyMessage` (registration/messages/notify.mail.ts): same
 * to()/locale() targeting, different content.
 */
export class MessageBouncedNotification extends MailBase<MessageBouncedNotificationPayload> {
  static readonly type = 'message-delivery:bounced';

  protected getTranslationOptions() {
    return {
      namespace: 'registration',
      keyPrefix: 'email.messageBounced',
    };
  }

  protected to(): AddressLike {
    const country = this.payload.registration.country;
    const event = this.payload.event;

    return objectValueOrAll(event.contactEmail, country ?? 'unknown');
  }

  protected locale(): string {
    return (
      this.payload.registration.country ?? this.payload.registration.locale
    );
  }

  protected subject(): string {
    return this.getT()('subject', { event: this.createEventContext() });
  }

  protected content(): Content {
    const { delivery, registration, event } = this.payload;

    const url = generateUrl(
      ['management', 'events', event.id, 'participants'],
      { registrationId: registration.id },
    );

    return {
      template: 'message-bounced',
      context: {
        event: this.createEventContext(),
        recipient: delivery.to,
        messageSubject: delivery.subject,
        url,
      },
    };
  }

  private createEventContext() {
    const locale = this.payload.registration.country ?? this.locale();

    return translateEventContext(this.payload.event, locale);
  }
}
