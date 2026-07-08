import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service.js';
import { sanitizeHtmlContent } from '#utils/sanitize';
import type { MessageWithFiles } from '#app/message/message.resource';

@injectable()
export class MessageService extends BaseService {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

  async queryMessages(campId: string): Promise<MessageWithFiles[]> {
    return this.prisma.message.findMany({
      where: { campId },
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: true,
        sentBy: { select: { id: true, name: true } },
        deliveries: { select: { registrationId: true, to: true } },
      },
    });
  }

  async getMessageById(campId: string, id: string) {
    return this.prisma.message.findFirst({
      where: {
        id,
        campId,
      },
      include: {
        attachments: true,
        sentBy: { select: { id: true, name: true } },
      },
    });
  }

  // Resolves a message by id alone (no camp scope) so the file guard can
  // derive the owning camp from the returned `campId`.
  async findMessageById(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });
  }

  async createMessage(
    campId: string,
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
    return this.prisma.message.create({
      data: {
        subject: data.subject,
        body: sanitizeHtmlContent(data.body),
        priority: data.priority,
        replyTo: data.replyTo,
        campId,
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
  }

  async deleteMessageById(id: string, campId: string) {
    return this.prisma.message.delete({
      where: {
        id,
        campId,
      },
    });
  }
}
