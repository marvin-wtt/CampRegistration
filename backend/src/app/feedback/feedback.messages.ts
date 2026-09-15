import { MailBase } from '#core/mail/mail.base';
import type { AddressLike, Content } from '#core/mail/mail.types';
import config from '#config/index';
import type { FeedbackProps, LocalContext } from '#views/emails/types';

export interface FeedbackData {
  message: string;
  location: string | undefined;
  userAgent: string | undefined;
  email: string | undefined;
}

export class FeedbackMessage extends MailBase<FeedbackData> {
  static readonly type = 'feedback:new';

  protected getTranslationOptions() {
    return {
      namespace: 'feedback',
      keyPrefix: 'email',
    };
  }

  protected subject(): string {
    return this.getT()('subject');
  }

  public to(): AddressLike {
    return config.email.admin;
  }

  protected replyTo(): AddressLike | undefined {
    return this.payload.email;
  }

  protected content(): Content {
    const t = this.getT();

    return {
      template: 'feedback',
      context: {
        preview: t('preview', { message: this.payload.message }),
        title: t('text.title'),
        replyNote: t('text.replyNote'),
        messageLabel: t('text.messageLabel'),
        locationLabel: t('text.locationLabel'),
        userAgentLabel: t('text.userAgentLabel'),
        message: this.payload.message,
        location: this.payload.location,
        userAgent: this.payload.userAgent,
        reason: t('footer.cause'),
      } satisfies LocalContext<FeedbackProps>,
    };
  }
}
