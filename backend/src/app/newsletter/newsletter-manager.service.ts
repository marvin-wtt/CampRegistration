import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class NewsletterManagerService extends BaseService {
  async isNewsletterManager(newsletterId: string, userId: string) {
    return this.prisma.newsletterManager
      .findFirst({ where: { newsletterId, userId } })
      .then((v) => v !== null);
  }

  async getManagers(newsletterId: string) {
    return this.prisma.newsletterManager.findMany({
      where: { newsletterId },
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
    });
  }

  async getManagerByUserId(newsletterId: string, userId: string) {
    return this.prisma.newsletterManager.findFirst({
      where: { newsletterId, userId },
    });
  }

  async getManagerById(newsletterId: string, id: string) {
    return this.prisma.newsletterManager.findFirst({
      where: { newsletterId, id },
    });
  }

  async addManager(newsletterId: string, userId: string) {
    return this.prisma.newsletterManager.create({
      data: { newsletterId, userId },
      include: { user: true },
    });
  }

  async removeManager(id: string) {
    return this.prisma.newsletterManager.delete({ where: { id } });
  }

  async countManagers(newsletterId: string) {
    return this.prisma.newsletterManager.count({ where: { newsletterId } });
  }
}
