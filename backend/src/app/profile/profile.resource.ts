import type {
  CampManager,
  NewsletterManager,
  OrganizationMember,
  OrganizationVerificationStatus,
  User,
} from '#generated/prisma/client.js';
import type {
  Profile as ProfileResourceData,
  OrganizationRole,
} from '@camp-registration/common/entities';
import type {
  CampScopedPermission,
  NewsletterPermission,
} from '@camp-registration/common/permissions';
import {
  ORGANIZATION_CAMP_ACCESS_ROLES,
  ORGANIZATION_CAMP_PERMISSIONS,
  ORGANIZATION_NEWSLETTER_PERMISSIONS,
} from '@camp-registration/common/permissions';
import { JsonResource } from '#core/resource/JsonResource';
import { permissionRegistry } from '#core/permission-registry';

type OrganizationMembership = OrganizationMember & {
  organization: {
    id: string;
    verificationStatus: OrganizationVerificationStatus;
    camps: { id: string }[];
    newsletters: { id: string }[];
  };
};

export interface UserWithCampRoles extends Omit<User, 'password'> {
  campRoles: CampManager[];
  newsletterManagers: NewsletterManager[];
  organizationMembers: OrganizationMembership[];
  twoFactor?: { confirmedAt: Date | null } | null;
}

/** Marks camp access that comes from administering the owning organization. */
const ORGANIZATION_DERIVED_ROLE = 'ORGANIZATION';

export class ProfileResource extends JsonResource<
  UserWithCampRoles,
  ProfileResourceData
> {
  transform(): ProfileResourceData {
    return {
      name: this.data.name,
      email: this.data.email,
      role: this.data.role,
      twoFactorEnabled: this.data.twoFactor?.confirmedAt != null,
      locale: this.data.locale,
      campAccess: this.buildCampAccess(),
      newsletterAccess: this.buildNewsletterAccess(),
      organizationAccess: this.data.organizationMembers.map((membership) => ({
        organizationId: membership.organizationId,
        role: membership.role as OrganizationRole,
        permissions: permissionRegistry
          .for('organization')
          .getPermissions(membership.role),
        verificationStatus: membership.organization.verificationStatus,
      })),
    };
  }

  /**
   * Camp-manager grants merged with the fixed set an organization
   * administrator holds over every camp their organization owns. Mirrors
   * {@link CampManagerService.getManagerAuthorization} — the two must agree, or
   * the UI would offer actions the API rejects (or hide ones it allows).
   *
   * Note this does not model camp-manager expiry, which `campAccess` has never
   * done; the server-side guard remains authoritative.
   */
  private buildCampAccess(): ProfileResourceData['campAccess'] {
    const access = new Map<
      string,
      { role: string; permissions: CampScopedPermission[] }
    >();

    for (const manager of this.data.campRoles) {
      access.set(manager.campId, {
        role: manager.role,
        permissions: permissionRegistry
          .for('camp')
          .getPermissions(manager.role),
      });
    }

    for (const membership of this.data.organizationMembers) {
      const grantsCampAccess = (
        ORGANIZATION_CAMP_ACCESS_ROLES as readonly string[]
      ).includes(membership.role);
      if (!grantsCampAccess) {
        continue;
      }

      for (const camp of membership.organization.camps) {
        const existing = access.get(camp.id);
        access.set(camp.id, {
          role: existing?.role ?? ORGANIZATION_DERIVED_ROLE,
          permissions: [
            ...new Set([
              ...(existing?.permissions ?? []),
              ...ORGANIZATION_CAMP_PERMISSIONS,
            ]),
          ],
        });
      }
    }

    return [...access.entries()].map(([campId, entry]) => ({
      campId,
      ...entry,
    }));
  }

  /**
   * The newsletter counterpart of {@link buildCampAccess}, mirroring
   * {@link NewsletterManagerService.getManagerPermissions}. Kept separate rather
   * than generalized so each scope keeps its own permission type — a camp
   * permission leaking into `newsletterAccess` must not compile.
   */
  private buildNewsletterAccess(): ProfileResourceData['newsletterAccess'] {
    const access = new Map<
      string,
      { role: string; permissions: NewsletterPermission[] }
    >();

    for (const manager of this.data.newsletterManagers) {
      access.set(manager.newsletterId, {
        role: manager.role,
        permissions: permissionRegistry
          .for('newsletter')
          .getPermissions(manager.role),
      });
    }

    for (const membership of this.data.organizationMembers) {
      const grantsAccess = (
        ORGANIZATION_CAMP_ACCESS_ROLES as readonly string[]
      ).includes(membership.role);
      if (!grantsAccess) {
        continue;
      }

      for (const newsletter of membership.organization.newsletters) {
        const existing = access.get(newsletter.id);
        access.set(newsletter.id, {
          role: existing?.role ?? ORGANIZATION_DERIVED_ROLE,
          permissions: [
            ...new Set([
              ...(existing?.permissions ?? []),
              ...ORGANIZATION_NEWSLETTER_PERMISSIONS,
            ]),
          ],
        });
      }
    }

    return [...access.entries()].map(([newsletterId, entry]) => ({
      newsletterId,
      ...entry,
    }));
  }
}
