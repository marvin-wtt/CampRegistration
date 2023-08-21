import { defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { Camp } from 'src/types/Camp';
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
    withProgressNotification,
    handlerByType,
    lazyFetch,
    checkNotNullWithError,
  } = useServiceHandler<Camp>('camp');

  authBus.on('logout', () => {
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
    newData: Partial<Camp>,
    notificationType: 'progress' | 'result' | 'error' | 'none' = 'progress'
  ) {
    const campId =
      newData.id ?? data.value?.id ?? (route.params.camp as string);

    checkNotNullWithError(campId);

    const newDataWithoutId = omitProperty(newData, 'id');

    await handlerByType(notificationType)('update', async () => {
      const updatedCamp = await api.updateCamp(campId, newDataWithoutId);

      // Replace element
      data.value = updatedCamp;
      bus.emit('update', updatedCamp);
    });
  }

  async function deleteData() {
    const campId = data.value?.id ?? (route.params.camp as string | undefined);

    const cid = checkNotNullWithError(campId);

    const success = await withProgressNotification('delete', async () => {
      await api.deleteCamp(cid);
      bus.emit('delete', cid);
    });

    if (success) {
      await router.push({ name: 'camp-management' });
    }
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    updateData,
    deleteData,
  };
});
