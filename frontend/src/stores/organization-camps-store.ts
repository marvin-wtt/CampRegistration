import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useOrganizationBus } from '@/composables/bus';
import type { Camp } from '@camp-registration/common/entities';

/** The camps owned by the organization in the current route. */
export const useOrganizationCampsStore = defineStore(
  'organizationCamps',
  () => {
    const route = useRoute();
    const api = useAPIService();
    const authBus = useAuthBus();
    const organizationBus = useOrganizationBus();
    const { data, isLoading, error, reset, invalidate, lazyFetch } =
      useServiceHandler<Camp[]>('organizationCamps');

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

      await lazyFetch(() => api.fetchOrganizationCamps(id));
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
