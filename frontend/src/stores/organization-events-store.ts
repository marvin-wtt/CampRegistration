import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useOrganizationBus } from '@/composables/bus';
import type { Event } from '@camp-registration/common/entities';

/** The events owned by the organization in the current route. */
export const useOrganizationEventsStore = defineStore(
  'organizationEvents',
  () => {
    const route = useRoute();
    const api = useAPIService();
    const authBus = useAuthBus();
    const organizationBus = useOrganizationBus();
    const { data, isLoading, error, reset, invalidate, lazyFetch } =
      useServiceHandler<Event[]>('organizationEvents');

    authBus.on('logout', () => {
      reset();
    });

    organizationBus.on('change', () => {
      invalidate();
    });

    async function fetchData(organizationId?: string) {
      const id =
        organizationId ?? (route.params.organizationId as string | undefined);
      if (!id) {
        return;
      }

      await lazyFetch(() => api.fetchOrganizationEvents(id));
    }

    return {
      data,
      isLoading,
      error,
      reset,
      invalidate,
      fetchData,
    };
  },
);
