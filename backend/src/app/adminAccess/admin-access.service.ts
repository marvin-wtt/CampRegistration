import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import type { PermissionScope } from '@camp-registration/common/permissions';
import { ADMIN_ACCESS_GRANT_MINUTES } from '@camp-registration/common/entities';
import type { AdminAccessGrant, Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import { findActiveAdminAccess } from '#core/permission/admin-access';
import { AuditService } from '#app/audit/audit.service';
import { adminAccessGrantAudit } from '#app/adminAccess/admin-access.audit';

const MINUTE_MS = 60 * 1000;

export interface AdminAccessGrantFilter {
  scope?: PermissionScope;
  userId?: string;
  active?: boolean;
  search?: string;
}

export interface AdminAccessGrantInput {
  scope: PermissionScope;
  scopeId: string;
  reason: string;
}

@injectable()
export class AdminAccessService extends BaseService {
  constructor(@inject(AuditService) private readonly audit: AuditService) {
    super();
  }

  async grant(
    userId: string,
    input: AdminAccessGrantInput,
  ): Promise<AdminAccessGrant> {
    await this.assertSubjectExists(input.scope, input.scopeId);

    if (await findActiveAdminAccess(userId, input.scope, input.scopeId)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Administrator access to this resource is already active',
      );
    }

    return this.transaction(async (tx) => {
      const grant = await tx.adminAccessGrant.create({
        data: {
          userId,
          scope: input.scope,
          scopeId: input.scopeId,
          reason: input.reason,
          expiresAt: new Date(
            Date.now() + ADMIN_ACCESS_GRANT_MINUTES * MINUTE_MS,
          ),
        },
      });
      await this.audit.recordFor(adminAccessGrantAudit, 'granted', grant);

      return grant;
    });
  }

  async end(userId: string, grantId: string): Promise<void> {
    const grant = await this.prisma.adminAccessGrant.findFirst({
      where: {
        id: grantId,
        userId,
        endedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!grant) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No active access grant');
    }

    await this.transaction(async (tx) => {
      const ended = await tx.adminAccessGrant.update({
        where: { id: grant.id },
        data: { endedAt: new Date() },
      });
      await this.audit.recordFor(adminAccessGrantAudit, 'ended', ended);
    });
  }

  async getActiveGrants(userId: string): Promise<AdminAccessGrant[]> {
    return this.prisma.adminAccessGrant.findMany({
      where: { userId, endedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });
  }

  /** Every administrator's grants, newest first, for peer review. */
  async queryGrants(
    filter: AdminAccessGrantFilter,
    options: { cursor?: string; limit?: number } = {},
  ) {
    const limit = options.limit ?? 25;
    const now = new Date();
    const where: Prisma.AdminAccessGrantWhereInput = {
      scope: filter.scope,
      userId: filter.userId,
      ...(filter.active === undefined
        ? {}
        : filter.active
          ? { endedAt: null, expiresAt: { gt: now } }
          : { OR: [{ endedAt: { not: null } }, { expiresAt: { lte: now } }] }),
      ...(filter.search
        ? {
            AND: {
              OR: [
                { reason: { contains: filter.search } },
                { user: { name: { contains: filter.search } } },
                { user: { email: { contains: filter.search } } },
              ],
            },
          }
        : {}),
    };

    const items = await this.prisma.adminAccessGrant.findMany({
      where,
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
    const total = options.cursor
      ? undefined
      : await this.prisma.adminAccessGrant.count({ where });
    const names = await this.getSubjectNames(page);
    const grants = page.map((grant) => ({
      ...grant,
      subjectName: names.get(grant.scopeId) ?? null,
    }));

    return { grants, nextCursor, limit, total };
  }

  /** Reasons of the event's grants by id, for the audit log. */
  async getReasonsByIds(
    eventId: string,
    ids: string[],
  ): Promise<Map<string, string>> {
    const grants = await this.prisma.adminAccessGrant.findMany({
      where: { id: { in: ids }, scope: 'event', scopeId: eventId },
      select: { id: true, reason: true },
    });

    return new Map(grants.map((grant) => [grant.id, grant.reason]));
  }

  private async getSubjectNames(
    grants: AdminAccessGrant[],
  ): Promise<Map<string, Prisma.JsonValue>> {
    const ids = (scope: PermissionScope) => ({
      where: {
        id: {
          in: grants.filter((g) => g.scope === scope).map((g) => g.scopeId),
        },
      },
      select: { id: true, name: true },
    });
    const [events, newsletters, organizations] = await Promise.all([
      this.prisma.event.findMany(ids('event')),
      this.prisma.newsletter.findMany(ids('newsletter')),
      this.prisma.organization.findMany(ids('organization')),
    ]);

    return new Map<string, Prisma.JsonValue>(
      [...events, ...newsletters, ...organizations].map((s) => [s.id, s.name]),
    );
  }

  private async assertSubjectExists(
    scope: PermissionScope,
    scopeId: string,
  ): Promise<void> {
    const where = { where: { id: scopeId } };
    const count =
      scope === 'event'
        ? await this.prisma.event.count(where)
        : scope === 'newsletter'
          ? await this.prisma.newsletter.count(where)
          : await this.prisma.organization.count(where);

    if (count === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, `No ${scope} with this id`);
    }
  }
}
