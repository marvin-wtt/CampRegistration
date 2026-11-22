import type { Prisma } from '#generated/prisma/client.js';
import type { EventRetentionDeadlineKind } from '@camp-registration/common/privacy';
import { MailBase } from '#core/mail/mail.base';
import { translate } from '@camp-registration/common/utils';
import { generateUrl } from '#utils/url';
import { resolveActionCardText } from '#core/mail/actionCardText';
import type { ActionCardProps, LocalContext } from '#views/emails/types';

export interface EventRetentionDeadlinePayload {
  event: { id: string; name: Prisma.JsonValue };
  /** A manager who can delete registrations, and so act on it. */
  recipient: { name: string | null; email: string; locale: string | null };
  kind: EventRetentionDeadlineKind;
  /** `YYYY-MM-DD`, in the event's time zone. */
  effectiveAt: string;
  /** Days before the deadline; 0 on or after it. */
  stage: number;
  /**
   * The days actually left when the job decided to send, not the stage: a
   * reminder sent late (after a postponement or a missed run) must not
   * promise 30 days. Counted then, so a delayed delivery doesn't shift it.
   */
  daysLeft: number;
}

/**
 * A retention deadline is coming up or has arrived. It asks for a review and,
 * where nothing must be kept, a deletion; nothing is deleted automatically.
 */
export class EventRetentionDeadlineMessage extends MailBase<EventRetentionDeadlinePayload> {
  static readonly type = 'event:retention-deadline';

  protected to() {
    const { name, email } = this.payload.recipient;

    return name ? { name, address: email } : email;
  }

  protected locale(): string | undefined {
    return this.payload.recipient.locale ?? undefined;
  }

  protected getTranslationOptions() {
    return {
      namespace: 'retention',
      keyPrefix: `email.manager.${this.payload.stage === 0 ? 'due' : 'upcoming'}`,
    };
  }

  protected subject(): string {
    // `count` picks the plural form; the due subject has none.
    return this.getT()('subject', {
      ...this.context(),
      count: this.payload.daysLeft,
    });
  }

  protected content() {
    const t = this.getT();

    return {
      template: 'action-card',
      context: {
        ...resolveActionCardText(t, this.context()),
        url: generateUrl([
          'management',
          'events',
          this.payload.event.id,
          'dashboard',
        ]),
      } satisfies LocalContext<ActionCardProps>,
    };
  }

  private context() {
    const locale = this.getLocale();
    const { event, kind, effectiveAt } = this.payload;

    return {
      event: {
        name: translate(event.name as string | Record<string, string>, locale),
      },
      // Nested into the texts: `$t(retention:kind.{{kindKey}})`.
      kindKey: kind,
      // A calendar date: formatted in UTC, where it is midnight, so no zone
      // moves it to another day.
      date: new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${effectiveAt}T00:00:00Z`)),
    };
  }
}
