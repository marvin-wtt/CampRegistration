import { watch } from 'vue';
import { useProfileStore } from '@/stores/profile-store';
import { useAssignedCampsStore } from '@/stores/assigned-camps-store';
import { useNewsletterStore } from '@/stores/newsletter-store';
import { useOrganizationsStore } from '@/stores/organizations-store';

export type WorkspaceAreaName = 'camps' | 'newsletters' | 'organizations';

export interface WorkspaceEntry {
  id: string;
  label: string;
  icon: string;
  caption?: string | undefined;
}

/**
 * The management area a route belongs to. Route names are already prefixed per
 * area (`management.camps`, `management.camp.settings.form`, …), so a prefix
 * test is enough and no route meta has to be maintained alongside them.
 */
export function areaFromRouteName(
  name: unknown,
): WorkspaceAreaName | undefined {
  const value = typeof name === 'string' ? name : '';

  if (value.startsWith('management.camp')) {
    return 'camps';
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
 * Warms the stores the switcher lists, from wherever the switcher itself is
 * mounted rather than from the panel it opens. Fetching on open let the panel
 * grow, swap row types and reposition while the user was already reading it —
 * on touch that moves targets out from under a finger. The stores fetch
 * lazily, so calling this on every management page costs nothing.
 */
export function useWorkspacePrefetch(): void {
  const profileStore = useProfileStore();
  const assignedCampsStore = useAssignedCampsStore();
  const newsletterStore = useNewsletterStore();
  const organizationsStore = useOrganizationsStore();

  // The profile resolves after the layout mounts, and it is what says whether
  // the other two areas exist for this user at all.
  watch(
    () => profileStore.user,
    (user) => {
      void assignedCampsStore.fetchData();

      if ((user?.newsletterAccess.length ?? 0) > 0) {
        void newsletterStore.fetchData();
      }
      if ((user?.organizationAccess.length ?? 0) > 0) {
        void organizationsStore.fetchData();
      }
    },
    { immediate: true },
  );
}
