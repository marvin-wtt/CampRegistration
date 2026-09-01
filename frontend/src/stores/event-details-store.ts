import { defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import type { EventDetails } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import { useRealtimeStore } from '@/stores/realtime-store';
import { omitProperty } from '@/utils/omitProperty';

export const useEventDetailsStore = defineStore('eventDetails', () => {
  const route = useRoute();
  const router = useRouter();
  const api = useAPIService();
  const bus = useEventBus();
  const authBus = useAuthBus();
  const realtime = useRealtimeStore();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    handlerByType,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
  } = useServiceHandler<EventDetails>('event');

  authBus.on('logout', () => {
    reset();
  });

  bus.on('update', (event) => {
    if (event?.id !== data.value?.id) {
      return;
    }

    if ('form' in event) {
      // We can assume that the event contains all details, and we don't need to prefetch it.
      data.value = event as EventDetails;
    } else {
      // It's a normal event - we need to fetch the details
      invalidate();
      void fetchData(event?.id);
    }
  });

  bus.on('delete', (eventId) => {
    if (data.value?.id !== eventId) {
      return;
    }
    reset();
  });

  // React to live changes pushed from other clients.
  realtime.on('event', (event) => void handleRemoteChange(event));
  realtime.onReconnect('event', () => {
    if (data.value === undefined) {
      return;
    }
    void fetchData(data.value.id, { background: true });
  });

  router.beforeEach(async (to, from) => {
    if (to.params.eventId === undefined) {
      if (data.value !== undefined) {
        reset();
        bus.emit('change', undefined);
      }
      return;
    }

    if (data.value === undefined || to.params.eventId !== from.params.eventId) {
      const eventId = to.params.eventId as string;
      invalidate();
      await fetchData(eventId);
    }
  });

  async function fetchData(id?: string, opts?: { background?: boolean }) {
    const eventId = id ?? (route.params.eventId as string);

    const cid = checkNotNullWithError(eventId);
    const fetcher = async () => {
      const result = await api.fetchEvent(cid);
      bus.emit('change', result);

      return result;
    };
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function updateData(
    newData: Partial<EventDetails>,
    notificationType: 'progress' | 'result' | 'error' | 'none' = 'progress',
  ): Promise<EventDetails | undefined> {
    const eventId =
      newData.id ?? data.value?.id ?? (route.params.eventId as string);

    checkNotNullWithError(eventId);

    // TODO Create multi omit function
    const newDataWithoutFreePlaces = omitProperty(newData, 'freePlaces');
    const newDataWithoutId = omitProperty(newDataWithoutFreePlaces, 'id');

    return handlerByType<EventDetails | undefined>(notificationType)(
      'update',
      async () => {
        const updatedEvent = await api.updateEvent(eventId, newDataWithoutId);

        bus.emit('update', updatedEvent);

        return updatedEvent;
      },
    );
  }

  // Applies a realtime change for the event currently loaded. Re-fetches details
  // through REST (where permissions apply) rather than trusting pushed data.
  async function handleRemoteChange(event: RealtimeEvent) {
    if (data.value?.id !== event.id) {
      return;
    }

    if (event.operation === 'deleted') {
      reset();
      bus.emit('delete', event.id);
      return;
    }

    await fetchData(event.id, { background: true });
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    updateData,
  };
});
