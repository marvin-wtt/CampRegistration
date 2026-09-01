import type { Prisma } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import type {
  OrganizationCreateData,
  OrganizationUpdateData,
  OrganizationVerificationStatus,
} from '@camp-registration/common/entities';
import { requiresReverification } from '@camp-registration/common/entities';
import type { Organization } from '#generated/prisma/client.js';

@injectable()
export class OrganizationService extends BaseService {
  constructor(
    @inject(PrivacyNoticeService)
    private readonly privacyNoticeService: PrivacyNoticeService,
  ) {
    super();
  }

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
   * Events are deliberately left published: a demotion is not a rejection, and
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
    const [events, newsletters] = await this.prisma.$transaction([
      this.prisma.event.count({ where: { organizationId: id } }),
      this.prisma.newsletter.count({ where: { organizationId: id } }),
    ]);

    return { events, newsletters };
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
   * Records a moderation decision.
   *
   * Rejection does not touch the events' `listed` flag. Reach is gated on the
   * organization's live status at every outward-facing action — the public
   * listing, the event `show` route and registration creation — so a rejected
   * organization's events stop reaching anyone the moment the status flips,
   * without overwriting a publication choice that is the owner's to make.
   */
  async applyVerificationDecision(
    id: string,
    reviewerUserId: string,
    status: Extract<OrganizationVerificationStatus, 'VERIFIED' | 'REJECTED'>,
    reviewNote?: string | null,
  ) {
    // Verifying an organization is the moment its events become able to reach
    // the public, so it is also the moment its privacy notice has to hold up.
    // Rejection is never blocked — a notice-less organization must stay
    // rejectable.
    if (status === 'VERIFIED') {
      const blocker =
        await this.privacyNoticeService.verificationBlockReason(id);

      if (blocker) {
        throw new ApiError(
          httpStatus.UNPROCESSABLE_ENTITY,
          `Organization cannot be verified while ${blocker}.`,
        );
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        verificationStatus: status,
        reviewNote: reviewNote ?? null,
        reviewedAt: new Date(),
        reviewedByUserId: reviewerUserId,
      },
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
