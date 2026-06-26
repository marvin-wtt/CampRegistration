import type { Prisma } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { sanitizeEmailHtml } from '#utils/sanitize';
import type { MessageTemplateWithFiles } from '#app/messageTemplate/message-template.resource';

@injectable()
export class MessageTemplateService extends BaseService {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

  async getMessageTemplateById(campId: string, id: string) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        id,
        campId,
      },
      include: {
        attachments: true,
      },
    });
  }

  // Ad-hoc templates (event === null) are sent messages governed by the message
  // permissions, so the message-template routes must only ever resolve reusable
  // automated templates (event !== null).
  async getEventTemplateById(campId: string, id: string) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        id,
        campId,
        event: { not: null },
      },
      include: {
        attachments: true,
      },
    });
  }

  async getMessageTemplateWithCamp(id: string) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        id,
      },
      include: {
        camp: { select: { id: true } },
        attachments: true,
      },
    });
  }

  async queryMessageTemplates(
    campId: string,
    options: { hasEvent?: boolean } = {},
  ): Promise<MessageTemplateWithFiles[]> {
    const where: Prisma.MessageTemplateWhereInput = { campId };
    if (options.hasEvent !== undefined) {
      where.event = options.hasEvent ? { not: null } : null;
    }

    // Recipients only apply to ad-hoc templates (event === null). Including the
    // messages relation for event templates would load their entire send log,
    // so it is limited to the ad-hoc query.
    if (options.hasEvent === false) {
      return this.prisma.messageTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          attachments: true,
          messages: { select: { registrationId: true, to: true } },
        },
      });
    }

    return this.prisma.messageTemplate.findMany({
      where,
      include: {
        attachments: true,
      },
    });
  }

  async getMessageTemplateByName(
    campId: string,
    event: string,
    country?: string | null,
  ) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        campId,
        event,
        country,
      },
      include: {
        attachments: true,
      },
    });
  }

  async createTemplate(
    campId: string,
    data: Omit<Prisma.MessageTemplateCreateInput, 'camp'> & {
      attachmentIds?: string[] | undefined;
    },
    fileFieldId: string,
  ) {
    return this.prisma.messageTemplate.create({
      data: {
        event: data.event,
        country: data.country,
        subject: data.subject,
        body: sanitizeEmailHtml(data.body),
        priority: data.priority,
        replyTo: data.replyTo,
        campId,
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
    campId: string,
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
          campId,
        },
        data: {
          subject: data.subject,
          body:
            data.body !== undefined ? sanitizeEmailHtml(data.body) : undefined,
          priority: data.priority,
          attachments,
        },
        include: {
          attachments: true,
        },
      });
    });
  }

  async deleteMessageTemplateById(id: string, campId: string) {
    return this.prisma.messageTemplate.delete({
      where: {
        id,
        campId,
      },
    });
  }
}
