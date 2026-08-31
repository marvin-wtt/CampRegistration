import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type {
  Duty,
  DutyCreateData,
  DutyUpdateData,
} from '@camp-registration/common/entities';

export const useDutyStore = defineStore('duty', () => {
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
  } = useServiceHandler<Duty[]>('duty');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients.
  useRealtimeCollection<Duty>('duty', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
  });

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    eventId ??= route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    const fetcher = () => api.fetchDuties(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function createData(newData: DutyCreateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);

    return withProgressNotification('create', async () => {
      const duty = await api.createDuty(eventId, newData);

      data.value?.push(duty);

      return duty;
    });
  }

  async function updateData(dutyId: string, updateData: DutyUpdateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(dutyId);

    await withProgressNotification('update', async () => {
      const duty = await api.updateDuty(eventId, dutyId, updateData);

      data.value = data.value?.map((value) =>
        value.id === duty.id ? duty : value,
      );
    });
  }

  async function deleteData(dutyId: string) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(dutyId);

    await withProgressNotification('delete', async () => {
      await api.deleteDuty(eventId, dutyId);

      data.value = data.value?.filter((duty) => duty.id !== dutyId);
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
