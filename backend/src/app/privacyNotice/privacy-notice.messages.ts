import type { Prisma } from '#generated/prisma/client.js';
import type { RetentionAnchor } from '@camp-registration/common/privacy';
import { MailBase } from '#app/mail/mail.base';
import { translateObject } from '#utils/translateObject';
import { generateUrl } from '#utils/url';

export interface CampRetentionDuePayload {
  camp: { id: string; name: Prisma.JsonValue };
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
 * Tells the managers who may delete a camp that the retention period its
 * registrants were shown is running out.
 *
 * Sent once per camp. It asks for a review rather than announcing a deletion:
 * nothing on the platform erases the data, and the mail must not imply that
 * something already has.
 */
export class CampRetentionDueMessage extends MailBase<CampRetentionDuePayload> {
  static readonly type = 'camp:retention-due';

  protected to() {
    const { name, email } = this.payload.recipient;

    return name ? { name, address: email } : email;
  }

  protected locale(): string | undefined {
    return this.payload.recipient.locale ?? undefined;
  }

  protected getTranslationOptions() {
    return {
      namespace: 'camp',
      keyPrefix: 'email.retentionDue',
    };
  }

  protected subject(): string {
    return this.getT()('subject', { camp: this.context().camp });
  }

  protected content() {
    return {
      template: 'camp-retention-due',
      context: this.context(),
    };
  }

  private context() {
    const locale = this.locale();
    const { camp, dueAt, months, anchor, hasExceptions, hasConsentBoundData } =
      this.payload;

    return {
      camp: {
        id: camp.id,
        name: translateObject(
          camp.name as string | Record<string, string>,
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
      url: generateUrl(['management', 'camps', camp.id, 'participants']),
    };
  }
}
