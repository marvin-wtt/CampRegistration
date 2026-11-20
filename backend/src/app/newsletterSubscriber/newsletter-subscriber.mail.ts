import { MailBase } from '#core/mail/mail.base';
import type { Content } from '#core/mail/mail.types';
import { generateUrl } from '#utils/url';
import { resolveActionCardText } from '#core/mail/actionCardText';
import type {
  LocalContext,
  NewsletterConfirmationProps,
} from '#views/emails/types';

export interface NewsletterConfirmationMailPayload {
  to: string;
  name: string | null;
  locale: string | null;
  newsletterName: string;
  organizationName: string;
  replyTo?: string;
  confirmationToken: string;
}

export class NewsletterConfirmationMail extends MailBase<NewsletterConfirmationMailPayload> {
  static readonly type = 'newsletter:confirm';

  protected getTranslationOptions() {
    return {
      namespace: 'newsletter',
      keyPrefix: 'email.confirmation',
    };
  }

  protected to() {
    const { to, name } = this.payload;

    return name ? { name, address: to } : to;
  }

  protected locale(): string | undefined {
    return this.payload.locale ?? undefined;
  }

  protected replyTo(): string | undefined {
    return this.payload.replyTo;
  }

  private vars() {
    return {
      newsletter: this.payload.newsletterName,
      organization: this.payload.organizationName,
    };
  }

  protected subject(): string {
    return this.getT()('subject', this.vars());
  }

  protected content(): Content {
    const t = this.getT();
    const url = generateUrl(
      `newsletters/confirm/${this.payload.confirmationToken}`,
    );

    return {
      template: 'newsletter-confirmation',
      context: {
        ...resolveActionCardText(t, this.vars()),
        reason: t('footer.cause', this.vars()),
        accidental: t('text.accidental'),
        url,
      } satisfies LocalContext<NewsletterConfirmationProps>,
    };
  }
}
