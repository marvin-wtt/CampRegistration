import { computed, watch, type ComputedRef } from 'vue';
import { useProfileStore } from '@/stores/profile-store';
import { useAssignedEventsStore } from '@/stores/assigned-events-store';
import { useNewsletterStore } from '@/stores/newsletter-store';
import { useOrganizationsStore } from '@/stores/organizations-store';

export type WorkspaceAreaName = 'events' | 'newsletters' | 'organizations';

export interface WorkspaceEntry {
  id: string;
  label: string;
  icon: string;
  caption?: string | undefined;
}

/**
 * The management area a route belongs to. Route names are already prefixed per
 * area (`management.events`, `management.event.settings.form`, …), so a prefix
 * test is enough and no route meta has to be maintained alongside them.
 */
export function areaFromRouteName(
  name: unknown,
): WorkspaceAreaName | undefined {
  const value = typeof name === 'string' ? name : '';

  if (value.startsWith('management.event')) {
    return 'events';
  }
  if (value.startsWith('management.newsletter')) {
    return 'newsletters';
  }
  if (value.startsWith('management.organization')) {
    return 'organizations';
  }

  return undefined;
}

/**
 * Whether the newsletter and organization areas exist for this user. Events are
 * left out: they are always offered, since the event index carries the create
 * flow for a user with none.
 *
 * The profile is the authority on access, but it is a snapshot taken at login
 * and refreshed on its own schedule — the moment a user founds their first
 * organization, the membership exists while `organizationAccess` still says it
 * does not. Falling back to what the store itself holds closes that window, so
 * the area appears as soon as the entity does instead of on the next profile
 * fetch.
 */
export function useWorkspaceAreaAccess(): {
  hasNewsletters: ComputedRef<boolean>;
  hasOrganizations: ComputedRef<boolean>;
} {
  const profileStore = useProfileStore();
  const newsletterStore = useNewsletterStore();
  const organizationsStore = useOrganizationsStore();

  const hasNewsletters = computed<boolean>(
    () =>
      (profileStore.user?.newsletterAccess.length ?? 0) > 0 ||
      (newsletterStore.data?.length ?? 0) > 0,
  );

  const hasOrganizations = computed<boolean>(
    () =>
      (profileStore.user?.organizationAccess.length ?? 0) > 0 ||
      (organizationsStore.data?.length ?? 0) > 0,
  );

  return { hasNewsletters, hasOrganizations };
}

/**
 * Warms the stores the switcher lists, from wherever the switcher itself is
 * mounted rather than from the panel it opens. Fetching on open let the panel
 * grow, swap row types and reposition while the user was already reading it —
 * on touch that moves targets out from under a finger. The stores fetch
 * lazily, so calling this on every management page costs nothing.
 */
export function useWorkspacePrefetch(): void {
  const profileStore = useProfileStore();
  const assignedEventsStore = useAssignedEventsStore();
  const newsletterStore = useNewsletterStore();
  const organizationsStore = useOrganizationsStore();
  const { hasNewsletters, hasOrganizations } = useWorkspaceAreaAccess();

  // The profile resolves after the layout mounts, and access says whether the
  // other two areas exist for this user at all — access is watched rather than
  // read once, so founding a first organization warms its list right away.
  watch(
    [() => profileStore.user, hasNewsletters, hasOrganizations],
    ([, newsletters, organizations]) => {
      void assignedEventsStore.fetchData();

      if (newsletters) {
        void newsletterStore.fetchData();
      }
      if (organizations) {
        void organizationsStore.fetchData();
      }
    },
    { immediate: true },
  );
}
