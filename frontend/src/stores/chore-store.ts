import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type {
  Chore,
  ChoreCreateData,
  ChoreUpdateData,
} from '@camp-registration/common/entities';

export const useChoreStore = defineStore('chore', () => {
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
  } = useServiceHandler<Chore[]>('chore');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients.
  useRealtimeCollection<Chore>('chore', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
  });

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    eventId ??= route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    const fetcher = () => api.fetchChores(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function createData(newData: ChoreCreateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);

    return withProgressNotification('create', async () => {
      const chore = await api.createChore(eventId, newData);

      data.value?.push(chore);

      return chore;
    });
  }

  async function updateData(choreId: string, updateData: ChoreUpdateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(choreId);

    await withProgressNotification('update', async () => {
      const chore = await api.updateChore(eventId, choreId, updateData);

      data.value = data.value?.map((value) =>
        value.id === chore.id ? chore : value,
      );
    });
  }

  async function deleteData(choreId: string) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(choreId);

    await withProgressNotification('delete', async () => {
      await api.deleteChore(eventId, choreId);

      data.value = data.value?.filter((chore) => chore.id !== choreId);
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
