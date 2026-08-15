import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import type {
  NewsletterManagerRole,
  NewsletterPermission,
} from '@camp-registration/common/permissions';
import { permissionRegistry } from '#core/permission-registry';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';

@injectable()
export class NewsletterManagerService extends BaseService {
  constructor(
    @inject(OrganizationMemberService)
    private readonly organizationMembers: OrganizationMemberService,
  ) {
    super();
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

  /**
   * The user's effective permissions on a newsletter, or `null` when they have
   * none. The only place the two sources meet: an explicit newsletter-manager
   * record, and the fixed minimal set an administrator of the owning
   * organization holds (see ORGANIZATION_NEWSLETTER_PERMISSIONS).
   */
  async getManagerPermissions(
    newsletterId: string,
    userId: string,
  ): Promise<ReadonlySet<NewsletterPermission> | null> {
    const [manager, organizationPermissions] = await Promise.all([
      this.getManagerByUserId(newsletterId, userId),
      this.organizationMembers.getOrganizationNewsletterPermissions(
        newsletterId,
        userId,
      ),
    ]);

    const managerPermissions = manager
      ? permissionRegistry.for('newsletter').getPermissions(manager.role)
      : [];

    if (
      managerPermissions.length === 0 &&
      organizationPermissions.length === 0
    ) {
      return null;
    }

    return new Set([...managerPermissions, ...organizationPermissions]);
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
