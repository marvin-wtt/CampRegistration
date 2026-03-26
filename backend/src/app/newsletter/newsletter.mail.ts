import { MailBase } from '#app/mail/mail.base';
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

  protected content() {
    return {
      html: this.payload.body,
    };
  }

  protected reason(): string {
    const unsubscribeUrl = this.getUnsubscribeUrl();
    return `You received this email because you subscribed to our newsletter. <a href="${unsubscribeUrl}">Unsubscribe</a>`;
  }
}
