import type { Event, Registration } from '#generated/prisma/client.js';
import {
  allCountryValues,
  eventCountry,
  forCountry,
} from '@camp-registration/common/utils';
import { localeForCountry } from '@camp-registration/common/locales';
import { translateEventContext } from '#app/event/event.util';
import { MailBase } from '#core/mail/mail.base';
import type { AddressLike, Content } from '#core/mail/mail.types';
import { generateUrl } from '#utils/url';
import { uniqueLowerCase } from '#utils/string';
import { resolveActionCardText } from '#core/mail/actionCardText';
import type {
  RegistrationManagerNotificationProps,
  LocalContext,
} from '#views/emails/types';

export class RegistrationNotifyMessage extends MailBase<{
  event: Event;
  registration: Registration;
}> {
  static readonly type = 'registration:notify';

  protected getTranslationOptions() {
    return {
      namespace: 'registration',
      keyPrefix: 'email.managerNotification',
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

  protected replyTo(): AddressLike | undefined {
    return uniqueLowerCase(this.payload.registration.emails ?? []);
  }

  protected subject(): string {
    const t = this.getT();
    const event = this.createEventContext();

    return t('subject', { event });
  }

  protected content(): Content {
    const t = this.getT();
    const event = this.payload.event;
    const registration = this.payload.registration;
    const eventContext = this.createEventContext();

    const url = generateUrl(
      ['management', 'events', event.id, 'participants'],
      {
        registrationId: registration.id,
      },
    );

    const vars = { event: eventContext, registration };

    return {
      template: 'registration-manager-notification',
      context: {
        eventName: eventContext.name,
        ...resolveActionCardText(t, vars),
        url,
      } satisfies LocalContext<RegistrationManagerNotificationProps>,
    };
  }

  private createEventContext() {
    return translateEventContext(this.payload.event, {
      locale: this.locale(),
      country: this.country(),
    });
  }
}
