import { useProfileStore } from 'stores/profile-store';
import { useCampDetailsStore } from 'stores/camp-details-store';
import type { Permission } from '@camp-registration/common/permissions';
import { storeToRefs } from 'pinia';

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

  function cannot(...permissions: Permission[]): boolean {
    return !can(...permissions);
  }

  return {
    can,
    canFor,
    cannot,
  };
}
