import { acceptHMRUpdate, defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import type { CampDetails } from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { omitProperty } from 'src/utils/omitProperty';

export const useCampDetailsStore = defineStore('campDetails', () => {
  const route = useRoute();
  const router = useRouter();
  const api = useAPIService();
  const bus = useCampBus();
  const authBus = useAuthBus();
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

  bus.on('update', async (camp) => {
    if (camp?.id !== data.value?.id) {
      return;
    }

    if ('form' in camp) {
      // We can assume that the camp contains all details, and we don't need to prefetch it.
      data.value = camp as CampDetails;
    } else {
      // It's a normal camp - we need to fetch the details
      invalidate();
      await fetchData(camp?.id);
    }
  });

  bus.on('delete', (campId) => {
    if (data.value?.id !== campId) {
      return;
    }
    reset();
  });

  router.beforeEach(async (to, from) => {
    if (to.params.camp === undefined) {
      if (data.value !== undefined) {
        reset();
        bus.emit('change', undefined);
      }
      return;
    }

    if (data.value === undefined || to.params.camp !== from.params.camp) {
      const campId = to.params.camp as string;
      invalidate();
      await fetchData(campId);
    }
  });

  async function fetchData(id?: string) {
    const campId = id ?? (route.params.camp as string);

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
      newData.id ?? data.value?.id ?? (route.params.camp as string);

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

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    updateData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCampDetailsStore, import.meta.hot));
}
