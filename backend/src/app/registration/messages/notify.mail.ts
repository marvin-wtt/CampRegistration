import type { Event, Registration } from '#generated/prisma/client.js';
import { objectValueOrAll } from '#utils/translateObject';
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
    const country = this.payload.registration.country;
    const event = this.payload.event;

    return objectValueOrAll(event.contactEmail, country ?? 'unknown');
  }

  protected locale(): string {
    // The locale of the contact mail is unknown, so we use the country and
    //  locale of the registration to determine the language of the email.
    return (
      this.payload.registration.country ?? this.payload.registration.locale
    );
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
    const locale = this.payload.registration.country ?? this.locale();

    return translateEventContext(this.payload.event, locale);
  }
}
