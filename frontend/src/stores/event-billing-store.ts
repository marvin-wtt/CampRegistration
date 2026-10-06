import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useEventBus } from '@/composables/bus';
import { useRealtimeStore } from '@/stores/realtime-store';
import type { EventBilling } from '@camp-registration/common/entities';

/** The price model of the event in the current route. */
export const useEventBillingStore = defineStore('eventBilling', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const realtime = useRealtimeStore();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    lazyFetch,
    backgroundFetch,
  } = useServiceHandler<EventBilling>('billing');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // The stream belongs to the current event, so any billing change is ours.
  // Refetch quietly while it is on screen; otherwise just mark it stale.
  function refreshFromRemote() {
    const id = route.params.eventId as string | undefined;
    if (!id || data.value === undefined) {
      invalidate();
      return;
    }

    void backgroundFetch(() => api.fetchEventBilling(id));
  }

  realtime.on('billing', refreshFromRemote);
  realtime.onReconnect('billing', refreshFromRemote);

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
