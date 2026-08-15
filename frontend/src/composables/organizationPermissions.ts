import { computed } from 'vue';
import { useProfileStore } from '@/stores/profile-store';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import type { OrganizationPermission } from '@camp-registration/common/permissions';
import { storeToRefs } from 'pinia';

/**
 * Organization-scoped counterpart to {@link usePermissions}, which resolves
 * against `campAccess` only. Kept separate on purpose: because
 * `OrganizationPermission` is part of the `Permission` union,
 * `can('organization.view')` type-checks there but always returns false.
 */
export function useOrganizationPermissions() {
  const profileStore = useProfileStore();
  const organizationDetailsStore = useOrganizationDetailsStore();

  const { user } = storeToRefs(profileStore);
  const { data: organization } = storeToRefs(organizationDetailsStore);

  function canOrgFor(
    organizationId: string | undefined,
    ...permissions: OrganizationPermission[]
  ): boolean {
    if (user.value?.role === 'ADMIN') {
      return true;
    }

    const access = user.value?.organizationAccess ?? [];
    const granted =
      access.find((value) => value.organizationId === organizationId)
        ?.permissions ?? [];

    return permissions.every((value) => granted.includes(value));
  }

  function canOrg(...permissions: OrganizationPermission[]): boolean {
    return canOrgFor(organization.value?.id, ...permissions);
  }

  function canAnyOrg(...permissions: OrganizationPermission[]): boolean {
    return permissions.some((value) => canOrg(value));
  }

  function cannotOrg(...permissions: OrganizationPermission[]): boolean {
    return !canOrg(...permissions);
  }

  function canAccessAnyOrg(
    permission?: OrganizationPermission | OrganizationPermission[],
  ): boolean {
    if (!permission) {
      return true;
    }

    return Array.isArray(permission)
      ? canAnyOrg(...permission)
      : canOrg(permission);
  }

  /**
   * Organizations the user may create a camp under. Drives the create-camp
   * gate, so it deliberately includes unverified ones — those produce drafts.
   */
  const campCreationOrganizationIds = computed<string[]>(() =>
    (user.value?.organizationAccess ?? [])
      .filter((access) =>
        access.permissions.includes('organization.camps.create'),
      )
      .map((access) => access.organizationId),
  );

  /** Newsletters, unlike camps, require a verified organization. */
  const newsletterCreationOrganizationIds = computed<string[]>(() =>
    (user.value?.organizationAccess ?? [])
      .filter(
        (access) =>
          access.verificationStatus === 'VERIFIED' &&
          access.permissions.includes('organization.newsletters.create'),
      )
      .map((access) => access.organizationId),
  );

  return {
    canOrg,
    canOrgFor,
    canAnyOrg,
    cannotOrg,
    canAccessAnyOrg,
    campCreationOrganizationIds,
    newsletterCreationOrganizationIds,
  };
}
