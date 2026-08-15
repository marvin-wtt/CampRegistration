import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import type {
  NewsletterManagerRole,
  NewsletterPermission,
} from '@camp-registration/common/permissions';
import { permissionRegistry } from '#core/permission-registry';

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

  async getManagerPermissions(
    newsletterId: string,
    userId: string,
  ): Promise<ReadonlySet<NewsletterPermission> | null> {
    const manager = await this.getManagerByUserId(newsletterId, userId);
    if (manager === null) {
      return null;
    }

    return new Set(
      permissionRegistry.for('newsletter').getPermissions(manager.role),
    );
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
