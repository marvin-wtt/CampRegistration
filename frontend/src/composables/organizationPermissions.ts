import { computed } from 'vue';
import { useProfileStore } from '@/stores/profile-store';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { storeToRefs } from 'pinia';
import { createScopePermissions } from '@/composables/scopePermissions';

/**
 * Organization-scoped counterpart to {@link usePermissions}. Kept as its own
 * composable so the two scopes' helpers cannot be confused at a call site; the
 * shared logic lives in {@link createScopePermissions}.
 */
export function useOrganizationPermissions() {
  const profileStore = useProfileStore();
  const organizationDetailsStore = useOrganizationDetailsStore();

  const { user } = storeToRefs(profileStore);
  const { data: organization } = storeToRefs(organizationDetailsStore);

  const { can, canAny, canFor, cannot, canAccessAny } =
    createScopePermissions<'organization'>({
      isAdmin: () => user.value?.role === 'ADMIN',
      granted: (organizationId) =>
        (user.value?.organizationAccess ?? []).find(
          (value) => value.organizationId === organizationId,
        )?.permissions ?? [],
      currentSubjectId: () => organization.value?.id,
    });

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
    canOrg: can,
    canOrgFor: canFor,
    canAnyOrg: canAny,
    cannotOrg: cannot,
    canAccessAnyOrg: canAccessAny,
    campCreationOrganizationIds,
    newsletterCreationOrganizationIds,
  };
}
