import { Camp, Registration } from '@prisma/client';
import messageService from '#app/message/message.service.js';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper.js';
import { translateObject } from '#utils/translateObject.js';
import notificationService from '#app/notification/notification.service.js';
import mailService from '#app/mail/mail.service';
import i18n, { t } from '#core/i18n';

class RegistrationMessages {
  async sendRegistrationConfirmation(camp: Camp, registration: Registration) {
    return messageService.createEventMessage(
      'registration:confirmation',
      camp,
      registration,
    );
  }

  async sendWaitingListNotification(camp: Camp, registration: Registration) {
    return messageService.createEventMessage(
      'registration:waiting_list',
      camp,
      registration,
    );
  }

  async notifyContactEmail(camp: Camp, registration: Registration) {
    const helper = new RegistrationCampDataHelper(registration.campData);
    const country = helper.country(camp.countries);

    const attachment = {
      filename: 'data.json',
      contentType: 'application/json',
      content: JSON.stringify(registration),
    };

    await i18n.changeLanguage(country);
    const subject = t('registration:email.managerNotification.subject');

    // TODO This should not happen by notification service
    const url = notificationService.generateUrl(`management/${camp.id}`);

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
        fullName: helper.fullName(),
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
