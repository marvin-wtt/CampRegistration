import type {
  Camp,
  Registration,
  MessageTemplate,
  Message,
  File,
} from '@prisma/client';
import messageTemplateService from '#app/messageTemplate/message-template.service';
import mailService from '#app/mail/mail.service';
import { translateObject } from '#utils/translateObject';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import registrationService from '#app/registration/registration.service';
import { BaseService } from '#core/base/BaseService';
import { RegistrationResource } from '#app/registration/registration.resource.js';

type MessageWithAttachments = Message & { attachments: File[] };
type MessageTemplateWithAttachments = MessageTemplate & { attachments: File[] };

export class MessageService extends BaseService {
  public uniqueEmails(emails: string[]): string[] {
    return [...new Set(emails.map((value) => value.trim().toLowerCase()))];
  }

  async sendTemplateMessage(
    template: MessageTemplateWithAttachments,
    camp: Camp,
    registration: Registration,
  ): Promise<MessageWithAttachments> {
    const country = registration.country ?? camp.countries[0];

    // Create compiler
    const subjectCompiler = messageTemplateService.createSubjectCompiler(
      translateObject(template.subject, country),
    );
    const bodyCompiler = messageTemplateService.createBodyCompiler(
      translateObject(template.body, country),
    );

    const context = this.createRegistrationContext(camp, registration, country);

    const message = await this.prisma.message.create({
      data: {
        registration: { connect: { id: registration.id } },
        template: { connect: { id: template.id } },
        replyTo:
          template.replyTo ?? translateObject(camp.contactEmail, country),
        priority: template.priority,
        subject: subjectCompiler(context),
        body: bodyCompiler(context),
        attachments: {
          createMany: {
            data: template.attachments.map((file) => ({
              name: file.name,
              storageLocation: file.storageLocation,
              originalName: file.originalName,
              type: file.type,
              size: file.size,
              accessLevel: 'private',
            })),
          },
        },
      },
      include: {
        attachments: true,
      },
    });

    await this.sendMessageToRegistration(message, registration);

    return message;
  }

  createCampContext(camp: Camp, locale: string) {
    return {
      ...camp,
      // Translate values
      name: translateObject(camp.name, locale),
      organizer: translateObject(camp.organizer, locale),
      contactEmail: translateObject(camp.contactEmail, locale),
      maxParticipants: translateObject(camp.maxParticipants, locale),
      location: translateObject(camp.location, locale),
    };
  }

  createRegistrationContext(
    camp: Camp,
    registration: Registration,
    locale: string,
  ): object {
    return {
      camp: {
        ...camp,
        // Translate values
        name: translateObject(camp.name, locale),
        organizer: translateObject(camp.organizer, locale),
        contactEmail: translateObject(camp.contactEmail, locale),
        maxParticipants: translateObject(camp.maxParticipants, locale),
        location: translateObject(camp.location, locale),
      },
      registration: new RegistrationResource(registration).transform(),
    };
  }

  private async sendMessageToRegistration(
    message: Message,
    registration: Registration,
  ) {
    // Filter duplicate emails
    const emails = this.uniqueEmails(registration.emails ?? []);
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

  async resendMessage(
    camp: Camp,
    message: MessageWithAttachments,
  ): Promise<MessageWithAttachments> {
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

    if (!template) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid message template');
    }

    return this.sendTemplateMessage(template, camp, registration);
  }

  async getMessageById(campId: string, id: string) {
    return this.prisma.message.findUnique({
      where: {
        id,
        registration: {
          campId,
        },
      },
      include: {
        attachments: true,
      },
    });
  }

  async getMessageWithCampById(id: string) {
    return this.prisma.message.findUnique({
      where: {
        id,
        registrationId: { not: null },
      },
      include: {
        registration: { include: { camp: { select: { id: true } } } },
        attachments: true,
      },
    });
  }
}

export default new MessageService();
