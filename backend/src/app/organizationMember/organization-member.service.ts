import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import { permissionRegistry } from '#core/permission-registry';
import type {
  CampScopedPermission,
  NewsletterPermission,
  OrganizationPermission,
  OrganizationRole,
} from '@camp-registration/common/permissions';
import {
  ORGANIZATION_CAMP_ACCESS_ROLES,
  ORGANIZATION_CAMP_PERMISSIONS,
  ORGANIZATION_NEWSLETTER_PERMISSIONS,
} from '@camp-registration/common/permissions';

@injectable()
export class OrganizationMemberService extends BaseService {
  async getMembers(organizationId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: true, invitation: true },
    });
  }

  async getMemberById(organizationId: string, id: string) {
    return this.prisma.organizationMember.findFirst({
      where: { id, organizationId },
      include: { user: true, invitation: true },
    });
  }

  async getMemberByUserId(organizationId: string, userId: string) {
    return this.prisma.organizationMember.findFirst({
      where: { organizationId, userId },
    });
  }

  async getMemberByEmail(organizationId: string, email: string) {
    return this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        OR: [{ user: { email } }, { invitation: { email } }],
      },
    });
  }

  /**
   * The organization's administrators who can actually receive mail — members
   * still holding an unaccepted invitation have no account yet.
   */
  async getAdministratorRecipients(organizationId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId, role: 'ADMIN', userId: { not: null } },
      select: { user: { select: { name: true, email: true, locale: true } } },
    });

    return members.map((member) => member.user).filter((user) => user !== null);
  }

  /**
   * The organization permissions `userId` holds on `organizationId`, or `null`
   * when they are not a member. The single resolution point for the scope — the
   * route guard and `profile.organizationAccess` both go through it.
   */
  async getMemberPermissions(
    organizationId: string,
    userId: string,
  ): Promise<ReadonlySet<OrganizationPermission> | null> {
    const member = await this.getMemberByUserId(organizationId, userId);
    if (member === null) {
      return null;
    }

    return new Set(
      permissionRegistry.for('organization').getPermissions(member.role),
    );
  }

  async hasPermission(
    organizationId: string,
    userId: string,
    permission: OrganizationPermission,
  ): Promise<boolean> {
    const permissions = await this.getMemberPermissions(organizationId, userId);

    return permissions?.has(permission) ?? false;
  }

  /**
   * The camp permissions `userId` holds implicitly because they administer the
   * organization that owns `campId`. Empty for MEMBERs, for non-members, and
   * for organizations that do not own the camp.
   *
   * Deliberately a fixed set rather than a registry lookup: an organization
   * role must never be able to widen into arbitrary camp permissions, least of
   * all access to participants' personal data.
   */
  async getOrganizationCampPermissions(
    campId: string,
    userId: string,
  ): Promise<readonly CampScopedPermission[]> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        role: { in: [...ORGANIZATION_CAMP_ACCESS_ROLES] },
        organization: { camps: { some: { id: campId } } },
      },
      select: { id: true },
    });

    return membership === null ? [] : ORGANIZATION_CAMP_PERMISSIONS;
  }

  /**
   * The newsletter counterpart of `getOrganizationCampPermissions`. Empty for
   * MEMBERs, for non-members, and for organizations that do not own the
   * newsletter.
   */
  async getOrganizationNewsletterPermissions(
    newsletterId: string,
    userId: string,
  ): Promise<readonly NewsletterPermission[]> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        role: { in: [...ORGANIZATION_CAMP_ACCESS_ROLES] },
        organization: { newsletters: { some: { id: newsletterId } } },
      },
      select: { id: true },
    });

    return membership === null ? [] : ORGANIZATION_NEWSLETTER_PERMISSIONS;
  }

  /**
   * Whether the organization has an admin other than `excludeMemberId`. An
   * unaccepted invitation does not count: its `userId` is still null, so nobody
   * can act on it, and treating it as an admin would let the last real one leave
   * an organization no one can manage.
   */
  async hasOtherAdmin(organizationId: string, excludeMemberId: string) {
    return this.prisma.organizationMember
      .findFirst({
        where: {
          organizationId,
          role: 'ADMIN',
          userId: { not: null },
          id: { not: excludeMemberId },
        },
      })
      .then((value) => value !== null);
  }

  async addMember(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ) {
    return this.prisma.organizationMember.create({
      data: { organizationId, userId, role },
      include: { user: true, invitation: true },
    });
  }

  /**
   * Invites someone who has no account yet. Mirrors the camp-manager flow: the
   * membership row is created with a null `userId` and is bound to the person
   * when they register with that address.
   */
  async inviteMember(
    organizationId: string,
    email: string,
    role: OrganizationRole,
  ) {
    return this.prisma.organizationMember.create({
      data: {
        organization: { connect: { id: organizationId } },
        role,
        invitation: {
          create: { organizationId, email },
        },
      },
      include: { user: true, invitation: true },
    });
  }

  async updateMemberById(id: string, role: OrganizationRole) {
    return this.prisma.organizationMember.update({
      where: { id },
      data: { role },
      include: { user: true, invitation: true },
    });
  }

  async removeMember(id: string) {
    await this.prisma.organizationMember.delete({ where: { id } });
  }

  /**
   * Binds pending invitations to a freshly registered account. Called from
   * registration alongside the camp-manager equivalent.
   */
  async resolveMemberInvitations(email: string, userId: string) {
    await this.prisma.organizationMember.updateMany({
      where: { invitation: { email } },
      data: { userId },
    });

    await this.prisma.organizationInvitation.deleteMany({ where: { email } });
  }
}
