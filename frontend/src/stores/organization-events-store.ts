import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import type { Event } from '@camp-registration/common/entities';

/** The events owned by the organization in the current route. */
export const useOrganizationEventsStore = defineStore(
  'organizationEvents',
  () => {
    const api = useAPIService();
    const events = useCollection<Event>({
      name: 'organizationEvents',
      key: useRouteKey('organizationId'),
      fetch: (organizationId) => api.fetchOrganizationEvents(organizationId),
    });

    function fetchData(organizationId?: string) {
      return events.load(organizationId);
    }

    return {
      data: events.data,
      isLoading: events.isLoading,
      error: events.error,
      reset: events.reset,
      invalidate: events.invalidate,
      fetchData,
    };
  },
);
