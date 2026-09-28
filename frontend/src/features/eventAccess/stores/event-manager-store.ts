import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useEventBus } from '@/composables/bus';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import type {
  EventManager,
  EventManagerCreateData,
  EventManagerUpdateData,
} from '@camp-registration/common/entities';

export const useEventManagerStore = defineStore('eventManager', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withProgressNotification,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<EventManager[]>('eventManager');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients.
  useRealtimeCollection<EventManager>('manager', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
    fetchOne: (eventId, id) => api.fetchEventManager(eventId, id),
  });

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    eventId ??= route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    const fetcher = () => api.fetchEventManagers(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function createData(newData: EventManagerCreateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);

    await withProgressNotification('create', async () => {
      const eventManager = await api.createEventManager(eventId, newData);

      data.value?.push(eventManager);
    });
  }

  async function updateData(
    managerId: string,
    updateData: EventManagerUpdateData,
  ) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(managerId);

    await withProgressNotification('update', async () => {
      const manager = await api.updateEventManager(
        eventId,
        managerId,
        updateData,
      );

      data.value = data.value?.map((value) =>
        value.id === manager.id ? manager : value,
      );
    });
  }

  async function deleteData(managerId: string) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(managerId);

    await withProgressNotification('delete', async () => {
      await api.deleteEventManager(eventId, managerId);

      data.value = data.value?.filter((manager) => manager.id !== managerId);
    });
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    createData,
    updateData,
    deleteData,
  };
});
