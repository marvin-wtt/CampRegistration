import type {
  Prisma,
  Camp,
  Registration,
  MessageTemplate,
  Message,
  File,
} from '@prisma/client';
import mailService from '#app/mail/mail.service';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import registrationService from '#app/registration/registration.service';
import { BaseService } from '#core/base/BaseService';
import { uniqueLowerCase } from '#utils/string';

type MessageWithAttachments = Message & { attachments: File[] };
type MessageTemplateWithAttachments = MessageTemplate & { attachments: File[] };

export class MessageService extends BaseService {
  async createMessage(
    registration: Registration,
    template: MessageTemplateWithAttachments,
    data: Omit<
      Prisma.MessageCreateInput,
      'id' | 'template' | 'registration' | 'createdAt' | 'attachments'
    >,
  ) {
    return this.prisma.message.create({
      data: {
        ...data,
        registration: { connect: { id: registration.id } },
        template: { connect: { id: template.id } },
        attachments: {
          // TODO Can I use connect instead?
          createMany: {
            data: template.attachments.map((file) => ({
              ...file,
              id: undefined,
              accessLevel: 'private',
            })),
          },
        },
      },
      include: {
        attachments: true,
      },
    });
  }

  private async sendMessageToRegistration(
    message: Message,
    registration: Registration,
  ) {
    // Filter duplicate emails
    const emails = uniqueLowerCase(registration.emails ?? []);
    await mailService.sendMessages(message, emails);
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

    // TODO Create new message instead
    await this.sendMessageToRegistration(message, registration);

    return message;
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
