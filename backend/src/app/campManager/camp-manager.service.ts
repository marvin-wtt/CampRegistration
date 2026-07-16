import { BaseService } from '#core/base/BaseService';
import { campPermissionRegistry } from '#core/permission-registry';
import type { Prisma } from '#generated/prisma/client.js';
import type { Permission } from '@camp-registration/common/permissions';
import { injectable } from 'inversify';

type ManagerCreateData = Pick<
  Prisma.CampManagerCreateInput,
  'role' | 'expiresAt'
>;

type ManagerUpdateData = Pick<
  Prisma.CampManagerUpdateInput,
  'role' | 'expiresAt'
>;

export interface ManagerAuthorization {
  managerId: string;
  permissions: Permission[];
  expiresAt: Date | null;
}

@injectable()
export class CampManagerService extends BaseService {
  /**
   * Resolves a user's current authorization for a camp: their own manager
   * record id, effective permission set, and expiry. Returns `null` when the
   * user is not a manager of the camp, or their manager record has expired.
   * Shared by the REST permission guard and the realtime-stream subscriber
   * resolver so both stay in sync.
   */
  async getManagerAuthorization(
    campId: string,
    userId: string,
  ): Promise<ManagerAuthorization | null> {
    const manager = await this.getManagerByUserId(campId, userId);
    if (manager === null) {
      return null;
    }

    if (manager.expiresAt !== null && manager.expiresAt <= new Date()) {
      return null;
    }

    return {
      managerId: manager.id,
      permissions: campPermissionRegistry.getPermissions(manager.role),
      expiresAt: manager.expiresAt,
    };
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
    const authorization = await this.getManagerAuthorization(campId, userId);

    return authorization?.permissions.includes(permission) ?? false;
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
      include: {
        invitation: true,
        user: true,
      },
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

  /**
   * Whether the camp has a non-expiring DIRECTOR other than
   * `excludeManagerId`. Used to guard against ever leaving a camp where every
   * director's access can lapse.
   */
  async hasOtherNonExpiringDirector(campId: string, excludeManagerId: string) {
    return this.prisma.campManager
      .findFirst({
        where: {
          campId,
          role: 'DIRECTOR',
          expiresAt: null,
          id: { not: excludeManagerId },
        },
      })
      .then((value) => value !== null);
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
    return this.prisma.campManager.create({
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
  }

  async inviteManager(campId: string, email: string, data: ManagerCreateData) {
    return this.prisma.campManager.create({
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
  }

  async updateManagerById(id: string, data: ManagerUpdateData) {
    return this.prisma.campManager.update({
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
  }

  async removeManager(id: string) {
    return this.prisma.campManager.delete({
      where: { id },
    });
  }
}
