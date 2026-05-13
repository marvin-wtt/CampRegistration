import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';

@injectable()
export class NewsletterMessageService extends BaseService {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }
  async getMessages(newsletterId: string) {
    return this.prisma.newsletterMessage.findMany({
      where: { newsletterId },
      include: { sentBy: { select: { id: true, name: true } } },
      orderBy: { sentAt: 'desc' },
    });
  }

  async getMessageById(newsletterId: string, id: string) {
    return this.prisma.newsletterMessage.findFirst({
      where: { id, newsletterId },
      include: { sentBy: { select: { id: true, name: true } } },
    });
  }

  async storeMessage(
    newsletterId: string,
    data: {
      subject: string;
      body: string;
      recipientCount: number;
      sentByUserId?: string;
      attachmentIds?: string[];
      sessionId: string;
    },
  ) {
    return this.prisma.newsletterMessage.create({
      data: {
        newsletterId,
        subject: data.subject,
        body: data.body,
        recipientCount: data.recipientCount,
        sentByUserId: data.sentByUserId,
        attachments: data.attachmentIds?.length
          ? this.fileService.getFileConnectInput(data.attachmentIds, data.sessionId)
          : undefined,
      },
      include: {
        sentBy: { select: { id: true, name: true } },
        attachments: true,
      },
    });
  }

  async deleteMessage(id: string) {
    return this.prisma.newsletterMessage.delete({ where: { id } });
  }
}
