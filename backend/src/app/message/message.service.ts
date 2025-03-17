import prisma from '#client.js';
import type {
  Camp,
  Registration,
  MessageTemplate,
  Message,
  File,
} from '@prisma/client';
import messageTemplateService from '#app/messageTemplate/message-template.service.js';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper.js';
import mailService from '#core/mail/mail.service.js';
import { translateObject } from '#utils/translateObject.js';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import registrationService from '#app/registration/registration.service.js';

class MessageService {
  public uniqueEmails(emails: string[]): string[] {
    return [...new Set(emails.map((value) => value.trim().toLowerCase()))];
  }

  async sendTemplateMessage(
    template: MessageTemplate,
    camp: Camp,
    registration: Registration,
  ): Promise<Message & { files: File[] }> {
    const helper = new RegistrationCampDataHelper(registration.campData);
    const country = helper.country(camp.countries) ?? camp.countries[0];

    // Create compiler
    const subjectCompiler = messageTemplateService.createCompiler(
      translateObject(template.subject, country),
    );
    const bodyCompiler = messageTemplateService.createCompiler(
      translateObject(template.body, country),
    );

    const context = {
      camp,
      registration,
    };

    const message = await prisma.message.create({
      data: {
        registration: { connect: { id: registration.id } },
        template: { connect: { id: template.id } },
        replyTo: translateObject(camp.contactEmail, country),
        subject: subjectCompiler(context),
        body: bodyCompiler(context),
      },
      include: {
        files: true,
      },
    });

    await this.sendMessageToRegistration(message, registration);

    return message;
  }

  private async sendMessageToRegistration(
    message: Message,
    registration: Registration,
  ) {
    // Filter duplicate emails
    const emails = this.uniqueEmails(
      new RegistrationCampDataHelper(registration.campData).emails(),
    );

    await mailService.sendMessages(message, emails);
  }

  async sendEventMessage(
    event: string,
    camp: Camp,
    registration: Registration,
  ) {
    const template = await messageTemplateService.getMessageTemplateByName(
      event,
      camp.id,
    );

    // Only send email when template is present
    // No template means, that emails are disabled
    if (!template) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Template event "${event}" not found`,
      );
    }

    return this.sendTemplateMessage(template, camp, registration);
  }

  async resendMessage(camp: Camp, message: Message) {
    if (!message.registrationId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Message does not belong to a registration',
      );
    }

    const registration = await registrationService.getRegistrationById(
      camp.id,
      message.registrationId,
    );
    // This should never happen
    if (!registration) {
      throw new ApiError(httpStatus.CONFLICT, 'Invalid registration id');
    }

    if (!message.templateId) {
      await this.sendMessageToRegistration(message, registration);

      return message;
    }

    // Regenerate message
    const template = await messageTemplateService.getMessageTemplateById(
      camp.id,
      message.templateId,
    );

    return this.sendTemplateMessage(template, camp, registration);
  }

  async getMessageById(campId: string, id: string) {
    return prisma.message.findUnique({
      where: {
        id,
        registration: {
          campId,
        },
      },
    });
  }
}

export default new MessageService();
