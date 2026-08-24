import type { Prisma } from '#generated/prisma/client.js';
import type { RetentionAnchor } from '@camp-registration/common/privacy';
import { MailBase } from '#app/mail/mail.base';
import { translateObject } from '#utils/translateObject';
import { generateUrl } from '#utils/url';

export interface EventRetentionDuePayload {
  event: { id: string; name: Prisma.JsonValue };
  recipient: { name: string | null; email: string; locale: string | null };
  /** ISO 8601 — the payload crosses a queue, where a `Date` would not survive. */
  dueAt: string;
  months: number;
  anchor: RetentionAnchor;
  /** Whether anything is held under an exception to the baseline period. */
  hasExceptions: boolean;
  /** Whether anything is held for as long as a consent stands. */
  hasConsentBoundData: boolean;
}

/**
 * Tells a event's directors that the retention period its registrants were
 * shown is running out.
 *
 * Sent once per event. It asks for a review rather than announcing a deletion:
 * nothing on the platform erases the data, and the mail must not imply that
 * something already has.
 */
export class EventRetentionDueMessage extends MailBase<EventRetentionDuePayload> {
  static readonly type = 'event:retention-due';

  protected to() {
    const { name, email } = this.payload.recipient;

    return name ? { name, address: email } : email;
  }

  protected locale(): string | undefined {
    return this.payload.recipient.locale ?? undefined;
  }

  protected getTranslationOptions() {
    return {
      namespace: 'event',
      keyPrefix: 'email.retentionDue',
    };
  }

  protected subject(): string {
    return this.getT()('subject', { event: this.context().event });
  }

  protected content() {
    return {
      template: 'event-retention-due',
      context: this.context(),
    };
  }

  private context() {
    const locale = this.locale();
    const { event, dueAt, months, anchor, hasExceptions, hasConsentBoundData } =
      this.payload;

    return {
      event: {
        id: event.id,
        name: translateObject(
          event.name as string | Record<string, string>,
          locale,
        ),
      },
      // Formatted here rather than in the template: only the mailable knows the
      // recipient's locale, and a retention date rendered in the server's is a
      // date read wrong in half the countries this runs in.
      dueAt: new Intl.DateTimeFormat(locale ?? 'en', {
        dateStyle: 'long',
      }).format(new Date(dueAt)),
      months,
      anchor,
      hasExceptions,
      hasConsentBoundData,
      url: generateUrl(['management', 'events', event.id, 'participants']),
    };
  }
}
