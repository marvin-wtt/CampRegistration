import { Camp, Registration } from '@prisma/client';
import messageTemplateService from '#app/messageTemplate/message-template.service.js';
import messageService from '#app/message/message.service.js';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper.js';
import { translateObject } from '#utils/translateObject.js';
import notificationService from '#app/notification/notification.service.js';

class RegistrationMessages {
  async sendRegistrationConfirmation(camp: Camp, registration: Registration) {
    return this.sendTemplateMessage(
      camp,
      registration,
      'registration:confirmation',
    );
  }

  async sendWaitingListNotification(camp: Camp, registration: Registration) {
    return this.sendTemplateMessage(
      camp,
      registration,
      'registration:waiting_list',
    );
  }

  async notifyContactEmail(camp: Camp, registration: Registration) {
    const helper = new RegistrationCampDataHelper(registration.campData);
    const replyTo = helper.emails();
    const country = helper.country(camp.countries);

    const attachement = {
      filename: 'data.json',
      contentType: 'application/json',
      content: JSON.stringify(registration),
    };

    const url = notificationService.generateUrl(`management/${camp.id}`);
    const context = {
      camp,
      registration,
      url,
    };

    // TODO
  }

  private async sendTemplateMessage(
    camp: Camp,
    registration: Registration,
    templateName: string,
  ) {
    const template = await messageTemplateService.getMessageTemplateByName(
      templateName,
      camp.id,
    );

    // Only send email when template is present
    // No template means, that emails are disabled
    if (!template) {
      return;
    }

    // Extract country for translated attributes
    const helper = new RegistrationCampDataHelper(registration.campData);
    const country = helper.country(camp.countries);

    // Create message
    const message = await messageService.createMessage({
      priority: template.priority,
      replyTo: translateObject(camp.contactEmail, country),
      subject: translateObject(template.subject, country),
      body: translateObject(template.body, country),
    });

    return messageService.sendMessageToRegistrations(
      camp,
      registration,
      message,
    );
  }
}

export default new RegistrationMessages();
