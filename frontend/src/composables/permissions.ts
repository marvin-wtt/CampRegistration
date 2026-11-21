import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile-store';
import {
  createScopePermissions,
  type PermissionRequirement,
} from '@/composables/scopePermissions';

/**
 * Event-scoped permissions, resolved against `profile.eventAccess`.
 *
 * `ScopePermission<'event'>` excludes the newsletter and organization strings,
 * so passing one is a compile error rather than a check that silently never
 * matches — those scopes have their own resolvers.
 *
 * The current subject comes from the route rather than the details store: it
 * is known before the event loads, and never names the previous event while
 * the next one does. Outside an event route, pass the id to `canFor`.
 */
export function usePermissions() {
  const profileStore = useProfileStore();
  const route = useRoute();

  const { user } = storeToRefs(profileStore);

  return createScopePermissions<'event'>({
    isAdmin: (id) => !!profileStore.activeAdminAccess('event', id),
    granted: (eventId) =>
      (user.value?.eventAccess ?? []).find((value) => value.eventId === eventId)
        ?.permissions ?? [],
    currentSubjectId: () => {
      const id = route.params.eventId;

      return Array.isArray(id) ? id[0] : id;
    },
  });
}

/**
 * Access to event pages, read from their route's `meta.eventPermission` so the
 * navigation, shortcuts and the layout's redirect share one requirement.
 */
export function useEventRouteAccess() {
  const router = useRouter();
  const { canAccess, canAccessFor } = usePermissions();

  function routePermission(
    name: string,
  ): PermissionRequirement<'event'> | undefined {
    return router.getRoutes().find((record) => record.name === name)?.meta
      .eventPermission;
  }

  /** On the open event, or on `eventId` when given. */
  function canAccessRoute(name: string, eventId?: string): boolean {
    const requirement = routePermission(name);

    return eventId === undefined
      ? canAccess(requirement)
      : canAccessFor(eventId, requirement);
  }

  return { routePermission, canAccessRoute };
}
