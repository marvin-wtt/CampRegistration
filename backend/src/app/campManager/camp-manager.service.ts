import { BaseService } from '#core/base/BaseService';
import { permissionRegistry } from '#core/permission-registry';
import type { Prisma } from '#generated/prisma/client.js';
import type { CampScopedPermission } from '@camp-registration/common/permissions';
import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';
import { inject, injectable } from 'inversify';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';

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
  permissions: Set<CampScopedPermission>;
  expiresAt: Date | null;
  revalidate?: boolean;
}

@injectable()
export class CampManagerService extends BaseService {
  constructor(
    @inject(OrganizationMemberService)
    private readonly organizationMembers: OrganizationMemberService,
  ) {
    super();
  }

  /**
   * Resolves a user's current authorization for a camp: their own manager
   * record id, effective permission set, and expiry. Returns `null` when the
   * user has neither a live manager record nor organization-derived access.
   * Shared by the REST permission guard and the realtime-stream subscriber
   * resolver so both stay in sync.
   *
   * Two sources are merged here, and this is the only place they meet: an
   * explicit camp-manager record, and the fixed minimal set an administrator of
   * the owning organization holds (see ORGANIZATION_CAMP_PERMISSIONS).
   */
  async getManagerAuthorization(
    campId: string,
    userId: string,
  ): Promise<ManagerAuthorization | null> {
    const [manager, organizationPermissions] = await Promise.all([
      this.getManagerByUserId(campId, userId),
      this.organizationMembers.getOrganizationCampPermissions(campId, userId),
    ]);

    // An expired record grants nothing, but must not mask organization-derived
    // access, which has no expiry of its own.
    const expired =
      manager !== null &&
      manager.expiresAt !== null &&
      manager.expiresAt <= new Date();
    const active = expired ? null : manager;

    const managerPermissions = active
      ? permissionRegistry.for('camp').getPermissions(active.role)
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
   * Authorization for a system administrator, who is not a camp manager and so
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
    permission: CampScopedPermission,
  ): Promise<boolean> {
    const authorization = await this.getManagerAuthorization(campId, userId);

    return authorization?.permissions.has(permission) ?? false;
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
