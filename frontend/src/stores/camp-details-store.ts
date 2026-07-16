import { defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import type { CampDetails } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useCampBus } from '@/composables/bus';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import { useRealtimeStore } from '@/stores/realtime-store';
import { omitProperty } from '@/utils/omitProperty';

export const useCampDetailsStore = defineStore('campDetails', () => {
  const route = useRoute();
  const router = useRouter();
  const api = useAPIService();
  const bus = useCampBus();
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
    checkNotNullWithError,
  } = useServiceHandler<CampDetails>('camp');

  authBus.on('logout', () => {
    reset();
  });

  bus.on('update', (camp) => {
    if (camp?.id !== data.value?.id) {
      return;
    }

    if ('form' in camp) {
      // We can assume that the camp contains all details, and we don't need to prefetch it.
      data.value = camp as CampDetails;
    } else {
      // It's a normal camp - we need to fetch the details
      invalidate();
      void fetchData(camp?.id);
    }
  });

  bus.on('delete', (campId) => {
    if (data.value?.id !== campId) {
      return;
    }
    reset();
  });

  // React to live changes pushed from other clients.
  realtime.on('camp', (event) => void handleRemoteChange(event));
  realtime.onReconnect('camp', () => {
    if (data.value === undefined) {
      return;
    }
    invalidate();
    void fetchData(data.value.id);
  });

  router.beforeEach(async (to, from) => {
    if (to.params.campId === undefined) {
      if (data.value !== undefined) {
        reset();
        bus.emit('change', undefined);
      }
      return;
    }

    if (data.value === undefined || to.params.campId !== from.params.campId) {
      const campId = to.params.campId as string;
      invalidate();
      await fetchData(campId);
    }
  });

  async function fetchData(id?: string) {
    const campId = id ?? (route.params.campId as string);

    const cid = checkNotNullWithError(campId);
    await lazyFetch(async () => {
      const result = await api.fetchCamp(cid);
      bus.emit('change', result);

      return result;
    });
  }

  async function updateData(
    newData: Partial<CampDetails>,
    notificationType: 'progress' | 'result' | 'error' | 'none' = 'progress',
  ): Promise<CampDetails | undefined> {
    const campId =
      newData.id ?? data.value?.id ?? (route.params.campId as string);

    checkNotNullWithError(campId);

    // TODO Create multi omit function
    const newDataWithoutFreePlaces = omitProperty(newData, 'freePlaces');
    const newDataWithoutId = omitProperty(newDataWithoutFreePlaces, 'id');

    return handlerByType<CampDetails | undefined>(notificationType)(
      'update',
      async () => {
        const updatedCamp = await api.updateCamp(campId, newDataWithoutId);

        bus.emit('update', updatedCamp);

        return updatedCamp;
      },
    );
  }

  // Applies a realtime change for the camp currently loaded. Re-fetches details
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

    invalidate();
    await fetchData(event.id);
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
