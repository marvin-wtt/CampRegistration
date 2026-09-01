import type {
  Event,
  EventManager,
  Invitation,
  User,
} from '#generated/prisma/client.js';
import { translateObject } from '#utils/translateObject';
import { MailBase } from '#app/mail/mail.base';
import { generateUrl } from '#utils/url';
import { countriesToLocales } from '#utils/countriesToLocales.js';

type EventManagerWithUserOrInvitation = EventManager & { user: User | null } & {
  invitation: Invitation | null;
};

abstract class EventManagerMessage<
  T extends { manager: EventManagerWithUserOrInvitation },
> extends MailBase<T> {
  protected to() {
    const email =
      this.payload.manager.user?.email ??
      this.payload.manager.invitation?.email;

    if (!email) {
      throw new Error('No email address available for manager');
    }

    const name = this.payload.manager.user?.name;
    if (name) {
      return {
        name,
        address: email,
      };
    }

    return email;
  }

  protected locale(): string | undefined {
    return this.payload.manager.user?.locale;
  }
}

export class EventManagerInvitationMessage extends EventManagerMessage<{
  manager: EventManagerWithUserOrInvitation;
  event: Event;
}> {
  static readonly type = 'manager:invitation';

  protected getTranslationOptions() {
    return {
      namespace: 'manager',
      keyPrefix: 'email.invitation',
    };
  }

  protected subject(): string {
    const t = this.getT();

    return t('subject');
  }

  protected locale(): string | undefined {
    const superLocale = super.locale();
    if (superLocale) {
      return superLocale;
    }

    if (this.payload.event.countries.length === 1) {
      return countriesToLocales(this.payload.event.countries)[0];
    }

    return undefined;
  }

  protected content() {
    const event = this.payload.event;
    const eventName = translateObject(event.name, this.locale());
    const url = generateUrl(['management', 'events', event.id]);

    return {
      template: 'manager-invitation',
      context: {
        event: {
          ...event,
          name: eventName,
        },
        user: this.payload.manager.user,
        url,
      },
    };
  }
}
