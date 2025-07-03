import type { Camp, Registration } from '@prisma/client';
import messageService from '#app/message/message.service';
import { objectValueOrAll } from '#utils/translateObject';
import mailService from '#app/mail/mail.service';
import i18n, { t } from '#core/i18n';
import { BaseMessages } from '#core/base/BaseMessages';
import { catchAndResolve } from '#utils/promiseUtils';

class RegistrationMessages extends BaseMessages {
  async sendRegistrationConfirmed(camp: Camp, registration: Registration) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_confirmed',
        camp,
        registration,
      ),
    );
  }

  async sendRegistrationWaitlisted(camp: Camp, registration: Registration) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_waitlisted',
        camp,
        registration,
      ),
    );
  }

  async sendRegistrationWaitlistAccepted(
    camp: Camp,
    registration: Registration,
  ) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_waitlist_accepted',
        camp,
        registration,
      ),
    );
  }

  async sendRegistrationUpdated(camp: Camp, registration: Registration) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_updated',
        camp,
        registration,
      ),
    );
  }

  async sendRegistrationCanceled(camp: Camp, registration: Registration) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_canceled',
        camp,
        registration,
      ),
    );
  }

  async notifyContactEmail(camp: Camp, registration: Registration) {
    const fn = async () => {
      const country = registration.country;

      const locale = country ?? registration.locale;
      await i18n.changeLanguage(locale);

      const context = {
        camp: messageService.createCampContext(camp, locale),
        registration: {
          url: this.generateUrl(`management/${camp.id}`),
          ...registration,
        },
      };

      // Use camp in context as the name is translated there
      const subject = `${t('registration:email.managerNotification.subject')} | ${context.camp.name}`;

      const attachment = {
        filename: 'data.json',
        contentType: 'application/json',
        content: JSON.stringify(registration),
      };

      await mailService.sendTemplateMail({
        template: 'registration-manager-notification',
        to: objectValueOrAll(camp.contactEmail, country ?? 'unknown'),
        replyTo: messageService.uniqueEmails(registration.emails ?? []),
        subject,
        context,
        attachments: [attachment],
      });
    };

    return catchAndResolve(fn());
  }
}

export default new RegistrationMessages();
