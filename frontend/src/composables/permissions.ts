import { useProfileStore } from '@/stores/profile-store';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { storeToRefs } from 'pinia';
import { createScopePermissions } from '@/composables/scopePermissions';

/**
 * Camp-scoped permissions, resolved against `profile.campAccess`.
 *
 * `ScopePermission<'camp'>` excludes the newsletter and organization strings,
 * so passing one is a compile error rather than a check that silently never
 * matches — those scopes have their own resolvers.
 */
export function usePermissions() {
  const profileStore = useProfileStore();
  const campDetailsStore = useCampDetailsStore();

  const { user } = storeToRefs(profileStore);
  const { data: camp } = storeToRefs(campDetailsStore);

  return createScopePermissions<'camp'>({
    isAdmin: () => user.value?.role === 'ADMIN',
    granted: (campId) =>
      (user.value?.campAccess ?? []).find((value) => value.campId === campId)
        ?.permissions ?? [],
    currentSubjectId: () => camp.value?.id,
  });
}
