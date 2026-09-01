import { useProfileStore } from '@/stores/profile-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { storeToRefs } from 'pinia';
import { createScopePermissions } from '@/composables/scopePermissions';

/**
 * Event-scoped permissions, resolved against `profile.eventAccess`.
 *
 * `ScopePermission<'event'>` excludes the newsletter and organization strings,
 * so passing one is a compile error rather than a check that silently never
 * matches — those scopes have their own resolvers.
 */
export function usePermissions() {
  const profileStore = useProfileStore();
  const eventDetailsStore = useEventDetailsStore();

  const { user } = storeToRefs(profileStore);
  const { data: event } = storeToRefs(eventDetailsStore);

  return createScopePermissions<'event'>({
    isAdmin: () => user.value?.role === 'ADMIN',
    granted: (eventId) =>
      (user.value?.eventAccess ?? []).find((value) => value.eventId === eventId)
        ?.permissions ?? [],
    currentSubjectId: () => event.value?.id,
  });
}
