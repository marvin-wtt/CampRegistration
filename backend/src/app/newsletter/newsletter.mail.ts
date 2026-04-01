import { MailBase } from '#app/mail/mail.base';
import type { JobOptions } from '#core/queue/Queue';
import type { MailPriority } from '#app/mail/mail.types';
import { generateUrl } from '#utils/url';

export interface NewsletterMailPayload {
  to: string;
  name: string | null;
  subject: string;
  body: string;
  newsletterId: string;
  unsubscribeToken: string;
}

export class NewsletterMail extends MailBase<NewsletterMailPayload> {
  static readonly type = 'newsletter:send';

  static jobOptions(): JobOptions {
    return { priority: 10 };
  }

  protected priority(): MailPriority {
    return 'low';
  }

  protected to() {
    const { to, name } = this.payload;

    if (name) {
      return { name, address: to };
    }

    return to;
  }

  protected subject(): string {
    return this.payload.subject;
  }

  private getUnsubscribeUrl(): string {
    return generateUrl(
      `newsletters/unsubscribe/${this.payload.unsubscribeToken}`,
    );
  }

  protected headers(): Record<string, string> {
    const unsubscribeUrl = this.getUnsubscribeUrl();

    return {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  protected getTranslationOptions() {
    return {
      namespace: 'newsletter',
      keyPrefix: 'email',
    };
  }

  protected content() {
    return {
      template: 'newsletter',
      context: {
        body: this.payload.body,
        unsubscribeUrl: this.getUnsubscribeUrl(),
      },
    };
  }
}
