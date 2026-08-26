import type { Prisma } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { sanitizeHtmlContent } from '#utils/sanitize';
import type { MessageTemplateWithFiles } from '#app/messageTemplate/message-template.resource';

@injectable()
export class MessageTemplateService extends BaseService {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

  async getMessageTemplateById(eventId: string, id: string) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        id,
        eventId,
      },
      include: {
        attachments: true,
      },
    });
  }

  async getMessageTemplateWithEvent(id: string) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        id,
      },
      include: {
        event: { select: { id: true } },
        attachments: true,
      },
    });
  }

  async queryMessageTemplates(
    eventId: string,
  ): Promise<MessageTemplateWithFiles[]> {
    return this.prisma.messageTemplate.findMany({
      where: { eventId },
      include: {
        attachments: true,
      },
    });
  }

  async getMessageTemplateByName(
    eventId: string,
    trigger: string,
    country?: string | null,
  ) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        eventId,
        trigger,
        country,
      },
      include: {
        attachments: true,
      },
    });
  }

  async createTemplate(
    eventId: string,
    data: Omit<Prisma.MessageTemplateCreateInput, 'event'> & {
      attachmentIds?: string[] | undefined;
    },
    fileFieldId: string,
  ) {
    return this.prisma.messageTemplate.create({
      data: {
        trigger: data.trigger,
        country: data.country,
        subject: data.subject,
        body: sanitizeHtmlContent(data.body),
        priority: data.priority,
        replyTo: data.replyTo,
        eventId,
        attachments: data.attachmentIds
          ? this.fileService.getFileConnectInput(
              data.attachmentIds,
              fileFieldId,
            )
          : undefined,
      },
      include: {
        attachments: true,
      },
    });
  }

  async updateMessageTemplate(
    id: string,
    eventId: string,
    data: Prisma.MessageTemplateUpdateInput & {
      attachmentIds?: string[] | undefined;
      body?: string | undefined;
    },
    sessionId: string,
  ) {
    const fileIds = data.attachmentIds ?? [];

    return this.prisma.$transaction(async (tx) => {
      const attachments = await this.fileService.syncFilesForOwner(
        tx,
        'messageTemplateId',
        id,
        fileIds,
        sessionId,
      );

      return tx.messageTemplate.update({
        where: {
          id,
          eventId,
        },
        data: {
          subject: data.subject,
          body:
            data.body !== undefined
              ? sanitizeHtmlContent(data.body)
              : undefined,
          priority: data.priority,
          attachments,
        },
        include: {
          attachments: true,
        },
      });
    });
  }

  async deleteMessageTemplateById(id: string, eventId: string) {
    return this.prisma.messageTemplate.delete({
      where: {
        id,
        eventId,
      },
    });
  }
}
