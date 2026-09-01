import type {
  Profile as ProfileResourceData,
  OrganizationRole,
} from '@camp-registration/common/entities';
import type {
  EventScopedPermission,
  NewsletterPermission,
} from '@camp-registration/common/permissions';
import {
  ORGANIZATION_EVENT_ACCESS_ROLES,
  ORGANIZATION_EVENT_PERMISSIONS,
  ORGANIZATION_NEWSLETTER_PERMISSIONS,
} from '@camp-registration/common/permissions';
import type { ProfileUser } from './profile.types.js';
import { JsonResource } from '#core/resource/JsonResource';
import { permissionRegistry } from '#core/permission-registry';

/** Marks event access that comes from administering the owning organization. */
const ORGANIZATION_DERIVED_ROLE = 'ORGANIZATION';

export class ProfileResource extends JsonResource<
  ProfileUser,
  ProfileResourceData
> {
  transform(): ProfileResourceData {
    return {
      name: this.data.name,
      email: this.data.email,
      role: this.data.role,
      twoFactorEnabled: this.data.twoFactor?.confirmedAt != null,
      locale: this.data.locale,
      eventAccess: this.buildEventAccess(),
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
   * Event-manager grants merged with the fixed set an organization
   * administrator holds over every event their organization owns. Mirrors
   * {@link EventManagerService.getManagerAuthorization} — the two must agree, or
   * the UI would offer actions the API rejects (or hide ones it allows).
   *
   * Note this does not model event-manager expiry, which `eventAccess` has never
   * done; the server-side guard remains authoritative.
   */
  private buildEventAccess(): ProfileResourceData['eventAccess'] {
    const access = new Map<
      string,
      {
        role: string;
        permissions: EventScopedPermission[];
        managerId: string | null;
      }
    >();

    for (const manager of this.data.eventRoles) {
      access.set(manager.eventId, {
        role: manager.role,
        permissions: permissionRegistry
          .for('event')
          .getPermissions(manager.role),
        managerId: manager.id,
      });
    }

    for (const membership of this.data.organizationMembers) {
      const grantsEventAccess = (
        ORGANIZATION_EVENT_ACCESS_ROLES as readonly string[]
      ).includes(membership.role);
      if (!grantsEventAccess) {
        continue;
      }

      for (const event of membership.organization.events) {
        const existing = access.get(event.id);
        access.set(event.id, {
          role: existing?.role ?? ORGANIZATION_DERIVED_ROLE,
          permissions: [
            ...new Set([
              ...(existing?.permissions ?? []),
              ...ORGANIZATION_EVENT_PERMISSIONS,
            ]),
          ],
          managerId: existing?.managerId ?? null,
        });
      }
    }

    return [...access.entries()].map(([eventId, entry]) => ({
      eventId,
      ...entry,
    }));
  }

  /**
   * The newsletter counterpart of {@link buildEventAccess}, mirroring
   * {@link NewsletterManagerService.getManagerPermissions}. Kept separate rather
   * than generalized so each scope keeps its own permission type — a event
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
        ORGANIZATION_EVENT_ACCESS_ROLES as readonly string[]
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
