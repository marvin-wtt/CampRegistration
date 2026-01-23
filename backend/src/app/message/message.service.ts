import type {
  Prisma,
  Registration,
  MessageTemplate,
  File,
} from '@prisma/client';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service.js';

type MessageTemplateWithAttachments = MessageTemplate & { attachments: File[] };

@injectable()
export class MessageService extends BaseService {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

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
        attachments: this.fileService.getFileCreateManyInput(
          template.attachments,
        ),
      },
      include: {
        attachments: true,
      },
    });
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
