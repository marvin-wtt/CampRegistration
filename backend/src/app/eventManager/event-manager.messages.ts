import type {
  Event,
  EventManager,
  EventInvitation,
  User,
} from '#generated/prisma/client.js';
import { translateObject } from '#utils/translateObject';
import { MailBase } from '#core/mail/mail.base';
import { generateUrl } from '#utils/url';
import { countriesToLocales } from '#utils/countriesToLocales.js';
import { resolveActionCardText } from '#core/mail/actionCardText';
import type { ActionCardProps, LocalContext } from '#views/emails/types';

type EventManagerWithUserOrInvitation = EventManager & { user: User | null } & {
  invitation: EventInvitation | null;
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
    const t = this.getT();
    const event = this.payload.event;
    const eventName = translateObject(event.name, this.locale());
    const url = generateUrl(['management', 'events', event.id]);
    const vars = { event: { name: eventName } };

    return {
      template: 'manager-invitation',
      context: {
        ...resolveActionCardText(t, vars),
        url,
      } satisfies LocalContext<ActionCardProps>,
    };
  }
}
