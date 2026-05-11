import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class NewsletterService extends BaseService {
  async getNewsletterById(id: string) {
    return this.prisma.newsletter.findUnique({ where: { id } });
  }

  async getAllNewsletters() {
    return this.prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNewslettersByUserId(userId: string) {
    return this.prisma.newsletter.findMany({
      where: {
        managers: {
          some: { userId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNewsletter(
    userId: string,
    data: {
      name: string;
      description?: string | null;
      replyTo?: string | null;
    },
  ) {
    return this.prisma.newsletter.create({
      data: {
        name: data.name,
        description: data.description,
        replyTo: data.replyTo,
        managers: {
          create: { userId },
        },
      },
    });
  }

  async updateNewsletter(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      replyTo?: string | null;
    },
  ) {
    return this.prisma.newsletter.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        replyTo: data.replyTo,
      },
    });
  }

  async deleteNewsletter(id: string) {
    return this.prisma.newsletter.delete({ where: { id } });
  }
}
