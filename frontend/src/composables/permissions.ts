import { useProfileStore } from '@/stores/profile-store';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import type { Permission } from '@camp-registration/common/permissions';
import { storeToRefs } from 'pinia';

/**
 * Camp-scoped permissions, resolved against `profile.campAccess`.
 *
 * Note `Permission` also contains the newsletter and organization unions, so
 * `can('organization.view')` type-checks here but always returns false — those
 * scopes have their own resolvers (`useOrganizationPermissions`, and the
 * newsletter manager list).
 */
export function usePermissions() {
  const profileStore = useProfileStore();
  const campDetailsStore = useCampDetailsStore();

  const { user } = storeToRefs(profileStore);
  const { data: camp } = storeToRefs(campDetailsStore);

  function canFor(
    campId: string | undefined,
    ...permissions: Permission[]
  ): boolean {
    if (user.value?.role === 'ADMIN') {
      return true;
    }

    const userPermissions = user.value?.campAccess ?? [];
    const campPermissions =
      userPermissions.find((value) => value.campId === campId)?.permissions ??
      [];

    return permissions.every((value) => campPermissions.includes(value));
  }

  function can(...permissions: Permission[]): boolean {
    return canFor(camp.value?.id, ...permissions);
  }

  function canAny(...permissions: Permission[]): boolean {
    return permissions.some((value) => can(value));
  }

  function cannot(...permissions: Permission[]): boolean {
    return !can(...permissions);
  }

  function canAccessAny(permission?: Permission | Permission[]): boolean {
    if (!permission) {
      return true;
    }
    return Array.isArray(permission) ? canAny(...permission) : can(permission);
  }

  return {
    can,
    canAny,
    canFor,
    cannot,
    canAccessAny,
  };
}
