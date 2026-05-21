import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import type { NewsletterManagerRole } from '@camp-registration/common/permissions';

@injectable()
export class NewsletterManagerService extends BaseService {
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

  async addManager(
    newsletterId: string,
    userId: string,
    role: NewsletterManagerRole = 'EDITOR',
  ) {
    return this.prisma.newsletterManager.create({
      data: { newsletterId, userId, role },
      include: { user: true },
    });
  }

  async removeManager(id: string) {
    return this.prisma.newsletterManager.delete({ where: { id } });
  }

  async countOwners(newsletterId: string) {
    return this.prisma.newsletterManager.count({
      where: { newsletterId, role: 'OWNER' },
    });
  }
}
