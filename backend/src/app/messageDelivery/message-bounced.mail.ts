import type {
  Event,
  MessageDelivery,
  Registration,
} from '#generated/prisma/client.js';
import { MailBase } from '#core/mail/mail.base';
import type { AddressLike, Content } from '#core/mail/mail.types';
import {
  allCountryValues,
  eventCountry,
  forCountry,
} from '@camp-registration/common/utils';
import { localeForCountry } from '@camp-registration/common/locales';
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
    const { contactEmail } = this.payload.event;

    // Without a country, every country's contact is told.
    return (
      forCountry(contactEmail, this.country()) ?? allCountryValues(contactEmail)
    );
  }

  protected locale(): string {
    // The contact's own language is unknown; the contact of a country
    // presumably reads that country's.
    const country = this.country();

    return country
      ? localeForCountry(country)
      : this.payload.registration.locale;
  }

  private country(): string | null {
    return eventCountry(this.payload.event, this.payload.registration.country);
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
    return translateEventContext(this.payload.event, {
      locale: this.locale(),
      country: this.country(),
    });
  }
}
