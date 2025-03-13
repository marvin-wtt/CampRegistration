import mailService from '#app/mail/mail.service';
import i18n, { t } from '#core/i18n.js';
import type { User } from '@prisma/client';
import { BaseMessages } from '#core/BaseMessages.js';

class AuthMessages extends BaseMessages {
  async sendVerificationEmail(user: User, token: string) {
    await i18n.changeLanguage(user?.locale);

    const subject = t('auth:email.verifyEmail.subject');
    const url = this.generateUrl('login', {
      email: user.email,
      token,
    });

    const context = {
      url,
    };

    await mailService.sendTemplateMail({
      template: 'verify-email',
      to: user.email,
      subject,
      context,
    });
  }

  async sendResetPasswordEmail(user: User, token: string) {
    await i18n.changeLanguage(user?.locale);

    const subject = t('auth:email.resetPassword.subject');
    const url = this.generateUrl('reset-password', {
      email: user.email,
      token,
    });

    const context = {
      url,
    };

    await mailService.sendTemplateMail({
      template: 'reset-password',
      to: user.email,
      subject,
      context,
    });
  }
}

export default new AuthMessages();
