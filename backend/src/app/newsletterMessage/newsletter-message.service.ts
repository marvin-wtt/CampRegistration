import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class NewsletterMessageService extends BaseService {
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
    },
  ) {
    return this.prisma.newsletterMessage.create({
      data: {
        newsletterId,
        subject: data.subject,
        body: data.body,
        recipientCount: data.recipientCount,
        sentByUserId: data.sentByUserId,
      },
      include: { sentBy: { select: { id: true, name: true } } },
    });
  }

  async deleteMessage(id: string) {
    return this.prisma.newsletterMessage.delete({ where: { id } });
  }
}
