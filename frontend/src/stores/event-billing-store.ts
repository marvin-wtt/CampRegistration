import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type { EventBilling } from '@camp-registration/common/entities';

/** The price model of the event in the current route. */
export const useEventBillingStore = defineStore('eventBilling', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const { data, isLoading, error, reset, invalidate, lazyFetch } =
    useServiceHandler<EventBilling>('billing');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  async function fetchData(eventId?: string) {
    const id = eventId ?? (route.params.eventId as string | undefined);
    if (!id) {
      return;
    }

    await lazyFetch(() => api.fetchEventBilling(id));
  }

  return {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    fetchData,
  };
});
