import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service.js';
import { AuditService } from '#app/audit/audit.service';
import { messageAuditPolicy } from '#app/message/message.audit';
import { sanitizeHtmlContent } from '#utils/sanitize';
import type { MessageWithFiles } from '#app/message/message.resource';

@injectable()
export class MessageService extends BaseService {
  constructor(
    @inject(FileService) private readonly fileService: FileService,
    @inject(AuditService) private readonly audit: AuditService,
  ) {
    super();
  }

  async queryMessages(eventId: string): Promise<MessageWithFiles[]> {
    return this.prisma.message.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: true,
        sentBy: { select: { id: true, name: true } },
        deliveries: { select: { registrationId: true, to: true } },
      },
    });
  }

  async getMessageById(eventId: string, id: string) {
    return this.prisma.message.findFirst({
      where: {
        id,
        eventId,
      },
      include: {
        attachments: true,
        sentBy: { select: { id: true, name: true } },
      },
    });
  }

  // Resolves a message by id alone (no event scope) so the file guard can
  // derive the owning event from the returned `eventId`.
  async findMessageById(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });
  }

  async createMessage(
    eventId: string,
    userId: string,
    data: {
      subject: string;
      body: string;
      priority?: string | undefined;
      replyTo?: string | undefined;
      attachmentIds?: string[] | undefined;
    },
    fileFieldId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          subject: data.subject,
          body: sanitizeHtmlContent(data.body),
          priority: data.priority,
          replyTo: data.replyTo,
          eventId,
          sentByUserId: userId,
          attachments: data.attachmentIds
            ? this.fileService.getFileConnectInput(
                data.attachmentIds,
                fileFieldId,
              )
            : undefined,
        },
        include: {
          attachments: true,
          sentBy: { select: { id: true, name: true } },
        },
      });

      await this.audit.record(tx, {
        action: 'created',
        entityType: messageAuditPolicy.entityType,
        entityId: message.id,
        eventId,
      });

      return message;
    });
  }

  async deleteMessageById(id: string, eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.message.delete({
        where: {
          id,
          eventId,
        },
      });

      await this.audit.record(tx, {
        action: 'deleted',
        entityType: messageAuditPolicy.entityType,
        entityId: id,
        eventId,
      });

      return deleted;
    });
  }
}
