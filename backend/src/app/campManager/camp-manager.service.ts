import { BaseService } from '#core/base/BaseService';
import { campPermissionRegistry } from '#core/permission-registry';
import type { Prisma } from '#generated/prisma/client.js';
import type { Permission } from '@camp-registration/common/permissions';
import { inject, injectable } from 'inversify';
import { AuditService } from '#app/audit/audit.service';
import {
  campManagerAuditPolicy,
  managerIdentity,
} from '#app/campManager/camp-manager.audit';

type ManagerCreateData = Pick<
  Prisma.CampManagerCreateInput,
  'role' | 'expiresAt'
>;

type ManagerUpdateData = Pick<
  Prisma.CampManagerUpdateInput,
  'role' | 'expiresAt'
>;

@injectable()
export class CampManagerService extends BaseService {
  constructor(@inject(AuditService) private readonly audit: AuditService) {
    super();
  }

  async campManagerExistsWithUserIdAndCampId(campId: string, userId: string) {
    return this.prisma.campManager
      .findFirst({
        where: {
          campId,
          userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      })
      .then((value) => value !== null);
  }

  async campManagerHasPermission(
    campId: string,
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    const manager = await this.getManagerByUserId(campId, userId);
    if (manager === null) {
      return false;
    }

    if (manager.expiresAt !== null && manager.expiresAt <= new Date()) {
      return false;
    }

    const permissions = campPermissionRegistry.getPermissions(manager.role);

    return permissions.includes(permission);
  }

  async getManagers(campId: string) {
    return this.prisma.campManager.findMany({
      where: { campId },
      include: {
        invitation: true,
        user: true,
      },
    });
  }

  async getManagerById(campId: string, id: string) {
    return this.prisma.campManager.findFirst({
      where: { id, campId },
    });
  }

  async getManagerByUserId(campId: string, userId: string) {
    return this.prisma.campManager.findFirst({
      where: { userId, campId },
    });
  }

  async getManagerByEmail(campId: string, email: string) {
    return this.prisma.campManager.findFirst({
      where: {
        campId,
        OR: [{ user: { email } }, { invitation: { email } }],
      },
    });
  }

  async resolveManagerInvitations(email: string, userId: string) {
    await this.prisma.campManager.updateMany({
      where: {
        invitation: {
          email,
        },
      },
      data: {
        userId,
      },
    });

    await this.prisma.invitation.deleteMany({
      where: {
        email,
      },
    });
  }

  async addManager(campId: string, userId: string, data: ManagerCreateData) {
    return this.prisma.$transaction(async (tx) => {
      const manager = await tx.campManager.create({
        data: {
          campId,
          userId,
          role: data.role,
          expiresAt: data.expiresAt,
        },
        include: {
          user: true,
          invitation: true,
        },
      });

      await this.audit.record(tx, {
        action: 'created',
        entityType: campManagerAuditPolicy.entityType,
        entityId: manager.id,
        campId,
        changes: { changedValues: managerIdentity(manager) },
      });

      return manager;
    });
  }

  async inviteManager(campId: string, email: string, data: ManagerCreateData) {
    return this.prisma.$transaction(async (tx) => {
      const manager = await tx.campManager.create({
        data: {
          camp: { connect: { id: campId } },
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

      // Same action as addManager — an invite is just a manager created for a
      // not-yet-registered user.
      await this.audit.record(tx, {
        action: 'created',
        entityType: campManagerAuditPolicy.entityType,
        entityId: manager.id,
        campId,
        changes: { changedValues: managerIdentity(manager) },
      });

      return manager;
    });
  }

  async updateManagerById(id: string, data: ManagerUpdateData) {
    return this.prisma.$transaction(async (tx) => {
      // Read the "before" inside the transaction so the audit diff is race-free.
      const before = await tx.campManager.findUniqueOrThrow({ where: { id } });

      const after = await tx.campManager.update({
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

      await this.audit.recordChange(tx, 'updated', campManagerAuditPolicy, {
        before,
        after,
        entityId: id,
        campId: before.campId,
      });

      return after;
    });
  }

  async removeManager(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.campManager.delete({
        where: { id },
      });

      await this.audit.record(tx, {
        action: 'deleted',
        entityType: campManagerAuditPolicy.entityType,
        entityId: id,
        campId: deleted.campId,
        changes: { changedValues: managerIdentity(deleted) },
      });

      return deleted;
    });
  }
}
