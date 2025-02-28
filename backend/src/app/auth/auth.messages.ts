import mailService from '#app/mail/mail.service';
import i18n, { t } from '#core/i18n.js';
import notificationService from '#app/notification/notification.service';
import type { User } from '@prisma/client';

class AuthMessages {
  async sendVerificationEmail(user: User, token: string) {
    await i18n.changeLanguage(user?.locale);

    const subject = t('auth:email.verifyEmail.subject');
    const url = notificationService.generateUrl('login', {
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
    const url = notificationService.generateUrl('reset-password', {
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
