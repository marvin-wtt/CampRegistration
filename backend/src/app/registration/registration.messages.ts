import { Camp, Registration } from '@prisma/client';
import messageService from '#app/message/message.service.js';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper.js';
import { translateObject } from '#utils/translateObject.js';
import mailService from '#app/mail/mail.service';
import i18n, { t } from '#core/i18n';
import { BaseMessages } from '#core/BaseMessages.js';

class RegistrationMessages extends BaseMessages {
  async sendRegistrationConfirmed(camp: Camp, registration: Registration) {
    return messageService.createEventMessage(
      'registration_confirmed',
      camp,
      registration,
    );
  }

  async sendRegistrationWaitlisted(camp: Camp, registration: Registration) {
    return messageService.createEventMessage(
      'registration_waitlisted',
      camp,
      registration,
    );
  }

  async notifyContactEmail(camp: Camp, registration: Registration) {
    const helper = new RegistrationCampDataHelper(registration.campData);
    const country = helper.country(camp.countries) ?? camp.countries[0];

    const attachment = {
      filename: 'data.json',
      contentType: 'application/json',
      content: JSON.stringify(registration),
    };

    await i18n.changeLanguage(country);
    const subject = t('registration:email.managerNotification.subject');

    const url = this.generateUrl(`management/${camp.id}`);

    const context = {
      camp: {
        ...camp,
        // Translate values
        name: translateObject(camp.name, country),
        organizer: translateObject(camp.organizer, country),
        contactEmail: translateObject(camp.contactEmail, country),
        maxParticipants: translateObject(camp.maxParticipants, country),
        location: translateObject(camp.location, country),
      },
      registration: {
        // Add additional fields to registration to simplify camp data access
        firstName: helper.firstName(),
        lastName: helper.lastName(),
        url,
        ...registration,
      },
    };

    await mailService.sendTemplateMail({
      template: 'registration-manager-notification',
      to: translateObject(camp.contactEmail, country),
      replyTo: helper.emails(),
      subject,
      context,
      attachments: [attachment],
    });
  }
}

export default new RegistrationMessages();
