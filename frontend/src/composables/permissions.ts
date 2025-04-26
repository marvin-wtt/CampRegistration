import { useProfileStore } from 'stores/profile-store';
import { useCampDetailsStore } from 'stores/camp-details-store';
import type { Permission } from '@camp-registration/common/permissions';
import { storeToRefs } from 'pinia';

export function usePermissions() {
  const profileStore = useProfileStore();
  const campDetailsStore = useCampDetailsStore();

  const { user } = storeToRefs(profileStore);
  const { data: camp } = storeToRefs(campDetailsStore);

  function can(...permissions: Permission[]): boolean {
    // TODO Enable admin permissions
    // if (data.value?.role === 'ADMIN') {
    //   return true;
    // }

    const userPermissions = user.value?.campAccess ?? [];
    const campPermissions =
      userPermissions.find((value) => value.campId === camp.value?.id)
        ?.permissions ?? [];

    return permissions.every((value) => campPermissions.includes(value));
  }

  function cannot(...permissions: Permission[]): boolean {
    return !can(...permissions);
  }

  return {
    can,
    cannot,
  };
}
