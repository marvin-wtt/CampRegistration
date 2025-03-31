import type { Camp, Registration } from '@prisma/client';
import messageService from '#app/message/message.service';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper';
import { objectValueOrAll } from '#utils/translateObject';
import mailService from '#core/mail/mail.service';
import i18n, { t } from '#core/i18n';
import { BaseMessages } from '#core/BaseMessages';
import { catchAndResolve } from '#utils/promiseUtils.js';

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
      const helper = new RegistrationCampDataHelper(registration.campData);
      const country = helper.country(camp.countries);

      const locale = country ?? registration.locale;
      await i18n.changeLanguage(locale);

      const context = {
        camp: messageService.createCampContext(camp, locale),
        registration: {
          // Add additional fields to registration to simplify camp data access
          firstName: helper.firstName(),
          lastName: helper.lastName(),
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
        to: objectValueOrAll(camp.contactEmail, country),
        replyTo: messageService.uniqueEmails(helper.emails()),
        subject,
        context,
        attachments: [attachment],
      });
    };

    return catchAndResolve(fn());
  }
}

export default new RegistrationMessages();
