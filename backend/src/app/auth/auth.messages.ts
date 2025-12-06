import type { User } from '@prisma/client';
import { MailBase } from '#app/mail/mail.base';
import type { Content } from '#app/mail/mail.types';
import { generateUrl } from '#utils/url';

abstract class UserMessage<T extends { user: User }> extends MailBase<T> {
  protected to() {
    return {
      name: this.payload.user.name,
      address: this.payload.user.email,
    };
  }

  protected getLocale(): string {
    return this.payload.user.locale;
  }
}

export class VerifyEmailMessage extends UserMessage<{
  user: User;
  token: string;
}> {
  static readonly type = 'auth:verify-email';

  protected getTranslationOptions() {
    return {
      namespace: 'auth',
      keyPrefix: 'email.verifyEmail',
    };
  }

  protected subject() {
    const t = this.getT();

    return t('subject');
  }

  protected content(): Content {
    const url = generateUrl('login', {
      email: this.payload.user.email,
      token: this.payload.token,
    });

    return {
      template: 'verify-email',
      context: {
        url,
      },
    };
  }
}

export class ResetPasswordMessage extends UserMessage<{
  user: User;
  token: string;
}> {
  static readonly type = 'auth:reset-password';

  protected getTranslationOptions() {
    return {
      namespace: 'auth',
      keyPrefix: 'email.resetPassword',
    };
  }

  protected subject() {
    const t = this.getT();

    return t('subject');
  }

  protected content(): Content {
    const url = generateUrl('reset-password', {
      email: this.payload.user.email,
      token: this.payload.token,
    });

    return {
      template: 'reset-password',
      context: {
        url,
      },
    };
  }
}
