import { BaseService } from '#core/base/BaseService';
import { permissionRegistry } from '#core/permission/permission.registry';
import type { Prisma } from '#generated/prisma/client.js';
import type { EventScopedPermission } from '@camp-registration/common/permissions';
import type {
  AccountDeletionBlocker,
  EventManagerRole,
} from '@camp-registration/common/entities';
import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';
import { inject, injectable } from 'inversify';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';
import { AuditService } from '#app/audit/audit.service';
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

// Weakest first.
const MANAGER_ROLES: string[] = [
  'VIEWER',
  'COUNSELOR',
  'COORDINATOR',
  'DIRECTOR',
] satisfies EventManagerRole[];

function strongerRole(a: string, b: string) {
  return MANAGER_ROLES.indexOf(b) > MANAGER_ROLES.indexOf(a) ? b : a;
}

/** `null` never expires. */
function laterExpiry(a: Date | null, b: Date | null) {
  if (a === null || b === null) {
    return null;
  }
  return b > a ? b : a;
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

  async resolveManagerInvitations({ id: userId, email }: VerifiedAccount) {
    await this.transaction(async (tx) => {
      const pending = await tx.eventManager.findMany({
        where: { invitation: { email } },
        include: { invitation: true },
      });
      const managed = await tx.eventManager.findMany({
        where: { userId, eventId: { in: pending.map((m) => m.eventId) } },
        include: { invitation: true },
      });
      const managedByEvent = new Map(managed.map((m) => [m.eventId, m]));

      for (const manager of pending) {
        // An existing access (under a previous address) absorbs the invitation,
        // keeping the stronger of both grants.
        const existing = managedByEvent.get(manager.eventId);
        if (existing) {
          const role = strongerRole(existing.role, manager.role);
          const expiresAt = laterExpiry(existing.expiresAt, manager.expiresAt);
          if (role !== existing.role || expiresAt !== existing.expiresAt) {
            const merged = await tx.eventManager.update({
              where: { id: existing.id },
              data: { role, expiresAt },
              include: { invitation: true },
            });
            await this.audit.updated(
              eventManagerAuditPolicy,
              existing,
              merged,
              {
                actorId: null,
              },
            );
          }

          await tx.eventManager.delete({ where: { id: manager.id } });
          await this.audit.deleted(eventManagerAuditPolicy, manager, {
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
          eventManagerAuditPolicy,
          'accepted',
          { ...manager, userId },
          { actorId: userId },
        );
      }

      await tx.invitation.deleteMany({ where: { email } });
    });
  }

  // Events the user is the last non-expiring director of; a pending
  // invitation counts as another director.
  async getSoleDirectorEvents(
    userId: string,
  ): Promise<AccountDeletionBlocker[]> {
    const events = await this.db.event.findMany({
      select: { id: true, name: true },
      where: {
        eventManager: { some: { userId, role: 'DIRECTOR', expiresAt: null } },
        NOT: {
          eventManager: {
            some: {
              role: 'DIRECTOR',
              expiresAt: null,
              OR: [{ userId: null }, { userId: { not: userId } }],
            },
          },
        },
      },
    });
    return events.map((event) => ({ type: 'event', ...event }));
  }

  // Deleting an account cascades past `removeManager`, so record it here.
  async auditAccountDeletion(userId: string) {
    await this.transaction(async (tx) => {
      const managers = await tx.eventManager.findMany({ where: { userId } });
      for (const manager of managers) {
        await this.audit.deleted(eventManagerAuditPolicy, manager, {
          details: { reason: 'account_deleted' },
        });
      }
    });
  }

  async addManager(eventId: string, userId: string, data: ManagerCreateData) {
    return this.transaction(async (tx) => {
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

      await this.audit.created(eventManagerAuditPolicy, manager, {
        details: managerGrant(manager),
      });

      return manager;
    });
  }

  async inviteManager(eventId: string, email: string, data: ManagerCreateData) {
    return this.transaction(async (tx) => {
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

      await this.audit.created(eventManagerAuditPolicy, manager, {
        details: managerGrant(manager),
      });

      return manager;
    });
  }

  async updateManagerById(id: string, data: ManagerUpdateData) {
    return this.transaction(async (tx) => {
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

      await this.audit.updated(eventManagerAuditPolicy, before, after);

      return after;
    });
  }

  async removeManager(id: string) {
    return this.transaction(async (tx) => {
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

      await this.audit.deleted(eventManagerAuditPolicy, deleted);

      return deleted;
    });
  }
}
