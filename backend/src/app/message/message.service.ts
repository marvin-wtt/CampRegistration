import prisma from '#client.js';
import type {
  Prisma,
  Camp,
  Registration,
  MessageTemplate,
  Message,
} from '@prisma/client';
import messageTemplateService from '#app/messageTemplate/message-template.service.js';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper.js';
import mailService from '#app/mail/mail.service.js';
import { translateObject } from '#utils/translateObject.js';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';

type MessageCreateInput = Pick<
  Prisma.MessageCreateInput,
  'subject' | 'body' | 'priority' | 'replyTo'
>;

class MessageService {
  async createTemplateMessage(
    template: MessageTemplate,
    camp: Camp,
    registration: Registration,
  ): Promise<Message> {
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
    });

    const emails = helper.emails();

    await mailService.sendMessages(message, emails);

    return message;
  }

  async createEventMessage(
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

    return this.createTemplateMessage(template, camp, registration);
  }

  async getMessageById(campId: string, id: string) {
    return prisma.message.findUniqueOrThrow({
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
