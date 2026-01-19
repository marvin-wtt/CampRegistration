import { MailBase } from '#app/mail/mail.base';
import type { AddressLike, Content } from '#app/mail/mail.types';
import config from '#config/index';

export interface FeedbackData {
  message: string;
  location: string | undefined;
  userAgent: string | undefined;
  email: string | undefined;
}

export class FeedbackMessage extends MailBase<FeedbackData> {
  static readonly type = 'feedback:new';

  protected subject(): string {
    return 'New Feedback';
  }

  public to(): AddressLike {
    return config.email.admin;
  }

  protected replyTo(): AddressLike | undefined {
    return this.payload.email;
  }

  protected content(): Content {
    return {
      template: 'feedback',
      context: {
        message: this.payload.message,
        location: this.payload.location,
        userAgent: this.payload.userAgent,
        email: this.payload.email,
      },
    };
  }
}
