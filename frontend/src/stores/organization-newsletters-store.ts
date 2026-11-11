import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import type { Newsletter } from '@camp-registration/common/entities';

/** The newsletters owned by the organization in the current route. */
export const useOrganizationNewslettersStore = defineStore(
  'organizationNewsletters',
  () => {
    const api = useAPIService();
    const newsletters = useCollection<Newsletter>({
      name: 'organizationNewsletters',
      key: useRouteKey('organizationId'),
      fetch: (organizationId) =>
        api.fetchOrganizationNewsletters(organizationId),
    });

    function fetchData(organizationId?: string) {
      return newsletters.load(organizationId);
    }

    return {
      data: newsletters.data,
      isLoading: newsletters.isLoading,
      error: newsletters.error,
      reset: newsletters.reset,
      invalidate: newsletters.invalidate,
      fetchData,
    };
  },
);
