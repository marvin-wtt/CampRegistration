import { BaseService } from '#core/base/BaseService';
import { permissionRegistry } from '#core/permission/permission.registry';
import type { Prisma } from '#generated/prisma/client.js';
import type { EventScopedPermission } from '@camp-registration/common/permissions';
import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';
import { inject, injectable } from 'inversify';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';
import { AuditService, type PrismaTransaction } from '#app/audit/audit.service';
import type { VerifiedAccount } from '#app/user/account.lifecycle';
import {
  eventManagerAuditPolicy,
  managerGrant,
} from '#app/eventManager/event-manager.audit';

type ManagerCreateData = Pick<
  Prisma.EventManagerCreateInput,
  'role' | 'expiresAt'
>;

type ManagerUpdateData = Pick<
  Prisma.EventManagerUpdateInput,
  'role' | 'expiresAt'
>;

export interface ManagerAuthorization {
  managerId: string;
  permissions: Set<EventScopedPermission>;
  expiresAt: Date | null;
  revalidate?: boolean;
}

@injectable()
export class EventManagerService extends BaseService {
  constructor(
    @inject(OrganizationMemberService)
    private readonly organizationMembers: OrganizationMemberService,
    @inject(AuditService) private readonly audit: AuditService,
  ) {
    super();
  }

  /**
   * Resolves a user's current authorization for a event: their own manager
   * record id, effective permission set, and expiry. Returns `null` when the
   * user has neither a live manager record nor organization-derived access.
   * Shared by the REST permission guard and the realtime-stream subscriber
   * resolver so both stay in sync.
   *
   * Two sources are merged here, and this is the only place they meet: an
   * explicit event-manager record, and the fixed minimal set an administrator of
   * the owning organization holds (see ORGANIZATION_EVENT_PERMISSIONS).
   */
  async getManagerAuthorization(
    eventId: string,
    userId: string,
  ): Promise<ManagerAuthorization | null> {
    const [manager, organizationPermissions] = await Promise.all([
      this.getManagerByUserId(eventId, userId),
      this.organizationMembers.getOrganizationEventPermissions(eventId, userId),
    ]);

    // An expired record grants nothing, but must not mask organization-derived
    // access, which has no expiry of its own.
    const expired =
      manager !== null &&
      manager.expiresAt !== null &&
      manager.expiresAt <= new Date();
    const active = expired ? null : manager;

    const managerPermissions = active
      ? permissionRegistry.for('event').getPermissions(active.role)
      : [];

    if (
      managerPermissions.length === 0 &&
      organizationPermissions.length === 0
    ) {
      return null;
    }

    return {
      managerId: active?.id ?? '',
      permissions: new Set([...managerPermissions, ...organizationPermissions]),
      expiresAt: active?.expiresAt ?? null,
      revalidate: organizationPermissions.length > 0,
    };
  }

  /**
   * Authorization for a system administrator, who is not a event manager and so
   * has no manager record. Grants every resource view permission (so
   * `shouldDeliver` passes for all events), a never-expiring snapshot, and an
   * empty `managerId` (no `manager` event can target them, so their permissions
   * never need refreshing).
   */
  getAdminAuthorization(): ManagerAuthorization {
    return {
      managerId: '',
      permissions: new Set(Object.values(RESOURCE_VIEW_PERMISSION)),
      expiresAt: null,
    };
  }

  async eventManagerExistsWithUserIdAndEventId(
    eventId: string,
    userId: string,
  ) {
    return this.prisma.eventManager
      .findFirst({
        where: {
          eventId,
          userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      })
      .then((value) => value !== null);
  }

  async eventManagerHasPermission(
    eventId: string,
    userId: string,
    permission: EventScopedPermission,
  ): Promise<boolean> {
    const authorization = await this.getManagerAuthorization(eventId, userId);

    return authorization?.permissions.has(permission) ?? false;
  }

  async getManagers(eventId: string) {
    return this.prisma.eventManager.findMany({
      where: { eventId },
      include: {
        invitation: true,
        user: true,
      },
    });
  }

  async getManagerById(eventId: string, id: string) {
    return this.prisma.eventManager.findFirst({
      where: { id, eventId },
      include: {
        invitation: true,
        user: true,
      },
    });
  }

  async getManagerByUserId(eventId: string, userId: string) {
    return this.prisma.eventManager.findFirst({
      where: { userId, eventId },
    });
  }

  async getManagerByEmail(eventId: string, email: string) {
    return this.prisma.eventManager.findFirst({
      where: {
        eventId,
        OR: [{ user: { email } }, { invitation: { email } }],
      },
    });
  }

  /**
   * Whether the event has a non-expiring DIRECTOR other than
   * `excludeManagerId`. Used to guard against ever leaving a event where every
   * director's access can lapse.
   */
  async hasOtherNonExpiringDirector(eventId: string, excludeManagerId: string) {
    return this.prisma.eventManager
      .findFirst({
        where: {
          eventId,
          role: 'DIRECTOR',
          expiresAt: null,
          id: { not: excludeManagerId },
        },
      })
      .then((value) => value !== null);
  }

  async resolveManagerInvitations(
    tx: PrismaTransaction,
    { id: userId, email }: VerifiedAccount,
  ) {
    const pending = await tx.eventManager.findMany({
      where: { invitation: { email } },
      include: { invitation: true },
    });
    const managed = await tx.eventManager.findMany({
      where: { userId, eventId: { in: pending.map((m) => m.eventId) } },
      select: { eventId: true },
    });
    const managedEventIds = new Set(managed.map((m) => m.eventId));

    for (const manager of pending) {
      // An existing access (under a previous address) stands.
      if (managedEventIds.has(manager.eventId)) {
        await tx.eventManager.delete({ where: { id: manager.id } });
        await this.audit.deleted(tx, eventManagerAuditPolicy, manager, {
          details: { reason: 'duplicate_invitation' },
          actorId: null,
        });
        continue;
      }

      await tx.eventManager.update({
        where: { id: manager.id },
        data: { userId },
      });
      // Links the invitation's earlier (masked) entries to the account.
      await this.audit.recordFor(
        tx,
        eventManagerAuditPolicy,
        'accepted',
        { ...manager, userId },
        { actorId: userId },
      );
    }

    await tx.invitation.deleteMany({ where: { email } });
  }

  async addManager(eventId: string, userId: string, data: ManagerCreateData) {
    return this.prisma.$transaction(async (tx) => {
      const manager = await tx.eventManager.create({
        data: {
          eventId,
          userId,
          role: data.role,
          expiresAt: data.expiresAt,
        },
        include: {
          user: true,
          invitation: true,
        },
      });

      await this.audit.created(tx, eventManagerAuditPolicy, manager, {
        details: managerGrant(manager),
      });

      return manager;
    });
  }

  async inviteManager(eventId: string, email: string, data: ManagerCreateData) {
    return this.prisma.$transaction(async (tx) => {
      const manager = await tx.eventManager.create({
        data: {
          event: { connect: { id: eventId } },
          role: data.role,
          expiresAt: data.expiresAt,
          invitation: {
            create: {
              email,
            },
          },
        },
        include: {
          invitation: true,
          user: true,
        },
      });

      await this.audit.created(tx, eventManagerAuditPolicy, manager, {
        details: managerGrant(manager),
      });

      return manager;
    });
  }

  async updateManagerById(id: string, data: ManagerUpdateData) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.eventManager.findUniqueOrThrow({
        where: { id },
        include: { invitation: true },
      });

      const after = await tx.eventManager.update({
        where: {
          id,
        },
        data: {
          role: data.role,
          expiresAt: data.expiresAt,
        },
        include: {
          invitation: true,
          user: true,
        },
      });

      await this.audit.updated(tx, eventManagerAuditPolicy, before, after);

      return after;
    });
  }

  async removeManager(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.eventManager.delete({
        where: { id },
        include: { invitation: true },
      });

      // A revoked invitation would otherwise keep the invitee's email forever.
      if (deleted.invitationId) {
        await tx.invitation.deleteMany({
          where: { id: deleted.invitationId, eventManager: { none: {} } },
        });
      }

      await this.audit.deleted(tx, eventManagerAuditPolicy, deleted);

      return deleted;
    });
  }
}
