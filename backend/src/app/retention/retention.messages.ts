import type { Prisma } from '#generated/prisma/client.js';
import type { RetentionDeadlineKind } from '@camp-registration/common/privacy';
import { MailBase } from '#core/mail/mail.base';
import { translate } from '@camp-registration/common/utils';
import { generateUrl } from '#utils/url';
import { resolveActionCardText } from '#core/mail/actionCardText';
import type { ActionCardProps, LocalContext } from '#views/emails/types';

export interface RetentionDeadlinePayload {
  event: { id: string; name: Prisma.JsonValue; organizationId: string };
  recipient: { name: string | null; email: string; locale: string | null };
  /** Managers can act; organization admins are informed on the deadline. */
  audience: 'manager' | 'organization';
  kind: RetentionDeadlineKind;
  /** ISO 8601 — the payload crosses a queue. */
  effectiveAt: string;
  /** Days before the deadline; 0 on or after it. */
  stage: number;
}

/**
 * A retention deadline is coming up or has arrived. It asks for a review and,
 * where nothing must be kept, a deletion; nothing is deleted automatically.
 */
export class RetentionDeadlineMessage extends MailBase<RetentionDeadlinePayload> {
  static readonly type = 'event:retention-deadline';

  protected to() {
    const { name, email } = this.payload.recipient;

    return name ? { name, address: email } : email;
  }

  protected locale(): string | undefined {
    return this.payload.recipient.locale ?? undefined;
  }

  protected getTranslationOptions() {
    const { audience, stage } = this.payload;

    return {
      namespace: 'retention',
      keyPrefix: `email.${audience}.${stage === 0 ? 'due' : 'upcoming'}`,
    };
  }

  protected subject(): string {
    return this.getT()('subject', this.context());
  }

  protected content() {
    const t = this.getT();
    const { event, audience } = this.payload;

    return {
      template: 'action-card',
      context: {
        ...resolveActionCardText(t, this.context()),
        url:
          audience === 'manager'
            ? generateUrl(['management', 'events', event.id, 'dashboard'])
            : generateUrl([
                'management',
                'organizations',
                event.organizationId,
                'dashboard',
              ]),
      } satisfies LocalContext<ActionCardProps>,
    };
  }

  private context() {
    const locale = this.getLocale();
    const { event, kind, effectiveAt, stage } = this.payload;

    return {
      event: {
        name: translate(event.name as string | Record<string, string>, locale),
      },
      // Nested into the texts: `$t(retention:kind.{{kindKey}})`.
      kindKey: kind,
      days: stage,
      date: new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(effectiveAt)),
    };
  }
}
