import type { Prisma } from '@prisma/client';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';

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

  async queryMessageTemplates(campId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { campId },
      include: {
        attachments: true,
      },
    });
  }

  async getMessageTemplateByName(
    campId: string,
    event: string,
    country?: string,
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
        body: data.body,
        priority: data.priority,
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
          body: data.body,
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
