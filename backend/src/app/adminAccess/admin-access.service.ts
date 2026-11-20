import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import type { PermissionScope } from '@camp-registration/common/permissions';
import { ADMIN_ACCESS_GRANT_MINUTES } from '@camp-registration/common/entities';
import type { AdminAccessGrant } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import { findActiveAdminAccess } from '#core/permission/admin-access';
import { AuditService } from '#app/audit/audit.service';
import { adminAccessGrantAudit } from '#app/adminAccess/admin-access.audit';

const MINUTE_MS = 60 * 1000;

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
