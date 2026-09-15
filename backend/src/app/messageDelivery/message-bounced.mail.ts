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
import { resolveActionCardText } from '#core/mail/actionCardText';
import type { MessageBouncedProps, LocalContext } from '#views/emails/types';

export interface MessageBouncedNotificationPayload {
  event: Event;
  registration: Registration;
  delivery: MessageDelivery;
}

/**
 * Tells the event's contact address that a message bounced. Mirrors
 * `RegistrationNotifyMessage`'s to()/locale() targeting.
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
    const t = this.getT();
    const { delivery, registration, event } = this.payload;
    const eventContext = this.createEventContext();

    const url = generateUrl(
      ['management', 'events', event.id, 'participants'],
      { registrationId: registration.id },
    );

    const vars = {
      event: eventContext,
      recipient: delivery.to,
      messageSubject: delivery.subject,
    };

    return {
      template: 'message-bounced',
      context: {
        eventName: eventContext.name,
        ...resolveActionCardText(t, vars),
        url,
      } satisfies LocalContext<MessageBouncedProps>,
    };
  }

  private createEventContext() {
    const locale = this.payload.registration.country ?? this.locale();

    return translateEventContext(this.payload.event, locale);
  }
}
