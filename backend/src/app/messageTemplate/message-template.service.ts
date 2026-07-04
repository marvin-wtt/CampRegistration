import type { Prisma } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { AuditService } from '#app/audit/audit.service';
import {
  messageTemplateAuditPolicy,
  templateIdentity,
} from '#app/messageTemplate/message-template.audit';
import { sanitizeEmailHtml } from '#utils/sanitize';
import type { MessageTemplateWithFiles } from '#app/messageTemplate/message-template.resource';

@injectable()
export class MessageTemplateService extends BaseService {
  constructor(
    @inject(FileService) private readonly fileService: FileService,
    @inject(AuditService) private readonly audit: AuditService,
  ) {
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

  async queryMessageTemplates(
    campId: string,
  ): Promise<MessageTemplateWithFiles[]> {
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
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.messageTemplate.create({
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

      await this.audit.record(tx, {
        action: 'created',
        entityType: messageTemplateAuditPolicy.entityType,
        entityId: template.id,
        campId,
        changes: { changedValues: templateIdentity(template) },
      });

      return template;
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
      const before = await tx.messageTemplate.findUniqueOrThrow({
        where: { id },
      });

      const attachments = await this.fileService.syncFilesForOwner(
        tx,
        'messageTemplateId',
        id,
        fileIds,
        sessionId,
      );

      const after = await tx.messageTemplate.update({
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

      await this.audit.recordChange(tx, 'updated', messageTemplateAuditPolicy, {
        before,
        after,
        entityId: id,
        campId,
      });

      return after;
    });
  }

  async deleteMessageTemplateById(id: string, campId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.messageTemplate.delete({
        where: {
          id,
          campId,
        },
      });

      await this.audit.record(tx, {
        action: 'deleted',
        entityType: messageTemplateAuditPolicy.entityType,
        entityId: id,
        campId,
        changes: { changedValues: templateIdentity(deleted) },
      });

      return deleted;
    });
  }
}
