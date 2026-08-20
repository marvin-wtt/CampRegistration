import type { Prisma } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

// `NewsletterResource` shows the owning organization, so every read loads it.
// `satisfies` rather than an annotation, so callers keep the two selected
// fields instead of inferring the full Organization — see `camp.service`.
const includeOrganization = {
  organization: {
    select: { id: true, name: true, verificationStatus: true },
  },
} satisfies Prisma.NewsletterInclude;

@injectable()
export class NewsletterService extends BaseService {
  async getNewsletterById(id: string) {
    return this.prisma.newsletter.findUnique({
      where: { id },
      include: includeOrganization,
    });
  }

  async queryNewsletters(
    filter: { name?: string; organizationId?: string } = {},
    options: {
      limit?: number;
      cursor?: string;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    } = {},
  ) {
    const limit = options.limit ?? 25;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const where: Prisma.NewsletterWhereInput = {
      name: filter.name ? { contains: filter.name } : undefined,
      organizationId: filter.organizationId,
    };

    const items = await this.prisma.newsletter.findMany({
      where,
      include: includeOrganization,
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ [sortBy]: sortType }, { id: sortType }],
    });

    const hasMore = items.length > limit;
    const newsletters = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore
      ? (newsletters[newsletters.length - 1]?.id ?? null)
      : null;
    const total = options.cursor
      ? undefined
      : await this.prisma.newsletter.count({ where });

    return { newsletters, nextCursor, limit, total };
  }

  async getNewslettersByUserId(userId: string) {
    return this.prisma.newsletter.findMany({
      where: {
        managers: {
          some: { userId },
        },
      },
      include: includeOrganization,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNewsletter(
    userId: string,
    data: {
      organizationId: string;
      name: string;
      description?: string | null;
      replyTo?: string | null;
    },
  ) {
    return this.prisma.newsletter.create({
      data: {
        organization: { connect: { id: data.organizationId } },
        name: data.name,
        description: data.description,
        replyTo: data.replyTo,
        managers: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: includeOrganization,
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
      include: includeOrganization,
    });
  }

  async deleteNewsletter(id: string) {
    return this.prisma.newsletter.delete({ where: { id } });
  }
}
