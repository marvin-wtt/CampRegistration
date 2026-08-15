import type { Prisma } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import type {
  OrganizationCreateData,
  OrganizationUpdateData,
  OrganizationVerificationStatus,
} from '@camp-registration/common/entities';
import { requiresReverification } from '@camp-registration/common/entities';
import type { Organization } from '#generated/prisma/client.js';

@injectable()
export class OrganizationService extends BaseService {
  async getOrganizationById(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async queryOrganizations(
    filter: {
      name?: string;
      verificationStatus?: OrganizationVerificationStatus;
    } = {},
    options: {
      limit?: number;
      cursor?: string;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    } = {},
  ) {
    const limit = options.limit ?? 25;
    const sortBy = options.sortBy ?? 'submittedAt';
    const sortType = options.sortType ?? 'desc';

    const where: Prisma.OrganizationWhereInput = {
      name: filter.name ? { contains: filter.name } : undefined,
      verificationStatus: filter.verificationStatus,
    };

    // Over-fetch by one to detect a further page; the `id` tiebreaker keeps the
    // cursor stable when the sort column has duplicates.
    const items = await this.prisma.organization.findMany({
      where,
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ [sortBy]: sortType }, { id: sortType }],
    });

    const hasMore = items.length > limit;
    const organizations = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore
      ? (organizations[organizations.length - 1]?.id ?? null)
      : null;
    // Only pay for the count on the first (uncursored) request.
    const total = options.cursor
      ? undefined
      : await this.prisma.organization.count({ where });

    return { organizations, nextCursor, limit, total };
  }

  async getOrganizationsByUserId(userId: string) {
    return this.prisma.organization.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** The creating user becomes its first ADMIN, so an organization is never ownerless. */
  async createOrganization(userId: string, data: OrganizationCreateData) {
    return this.prisma.organization.create({
      data: {
        ...data,
        verificationStatus: 'PENDING',
        submittedAt: new Date(),
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
    });
  }

  /**
   * Applies an edit, sending the organization back for re-review when it
   * changes the legal identity that was vetted (see
   * {@link requiresReverification}).
   *
   * Camps are deliberately left published: a demotion is not a rejection, and
   * the registration guard and public listing already exclude unverified
   * organizations. Leaving the flag alone means they simply reappear once the
   * organization is verified again, instead of every edit silently costing the
   * organization its publication state.
   */
  async updateOrganization(
    organization: Organization,
    data: OrganizationUpdateData,
  ) {
    const demote =
      requiresReverification(organization, data) &&
      organization.verificationStatus !== 'PENDING';

    const demoteDate = demote
      ? {
          verificationStatus: 'PENDING' as const,
          submittedAt: new Date(),
          reviewNote: null,
          reviewedAt: null,
          reviewedByUserId: null,
        }
      : {};

    return this.prisma.organization.update({
      where: { id: organization.id },
      data: {
        ...data,
        ...demoteDate,
      },
    });
  }

  async deleteOrganization(id: string) {
    await this.prisma.organization.delete({ where: { id } });
  }

  async countOwnedResources(id: string) {
    const [camps, newsletters] = await this.prisma.$transaction([
      this.prisma.camp.count({ where: { organizationId: id } }),
      this.prisma.newsletter.count({ where: { organizationId: id } }),
    ]);

    return { camps, newsletters };
  }

  /** Puts a previously rejected organization back into the moderation queue. */
  async resubmitForVerification(id: string) {
    return this.prisma.organization.update({
      where: { id },
      data: {
        verificationStatus: 'PENDING',
        submittedAt: new Date(),
        reviewNote: null,
        reviewedAt: null,
        reviewedByUserId: null,
      },
    });
  }

  /**
   * Records a moderation decision and, on rejection, immediately unpublishes
   * every camp the organization owns.
   *
   * The unpublish runs in the same transaction as the status change rather than
   * in a background job: the whole point of verification is that an unmoderated
   * entity must not be collecting participant data, so there must be no window
   * in which the organization is rejected but its camps are still public.
   */
  async applyVerificationDecision(
    id: string,
    reviewerUserId: string,
    decision: {
      status: Extract<OrganizationVerificationStatus, 'VERIFIED' | 'REJECTED'>;
      reviewNote?: string | null;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.update({
        where: { id },
        data: {
          verificationStatus: decision.status,
          reviewNote: decision.reviewNote ?? null,
          reviewedAt: new Date(),
          reviewedByUserId: reviewerUserId,
        },
      });

      const unpublishedCampIds: string[] = [];
      if (decision.status === 'REJECTED') {
        const publicCamps = await tx.camp.findMany({
          where: { organizationId: id, public: true },
          select: { id: true },
        });

        if (publicCamps.length > 0) {
          await tx.camp.updateMany({
            where: { organizationId: id, public: true },
            data: { public: false },
          });
          unpublishedCampIds.push(...publicCamps.map((camp) => camp.id));
        }
      }

      return { organization, unpublishedCampIds };
    });
  }

  async getOverviewCounts() {
    const [total, pending, verified, rejected] = await this.prisma.$transaction(
      [
        this.prisma.organization.count(),
        this.prisma.organization.count({
          where: { verificationStatus: 'PENDING' },
        }),
        this.prisma.organization.count({
          where: { verificationStatus: 'VERIFIED' },
        }),
        this.prisma.organization.count({
          where: { verificationStatus: 'REJECTED' },
        }),
      ],
    );

    return { total, pending, verified, rejected };
  }
}
