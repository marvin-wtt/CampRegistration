import { defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { Camp } from 'src/types/Camp';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';

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
    withProgressNotification,
    errorOnFailure,
    checkNotNullWithError,
  } = useServiceHandler<Camp>('camp');

  authBus.on('logout', () => {
    reset();
  });

  router.beforeEach(async (to, from) => {
    if (to.params.camp === undefined) {
      return;
    }

    if (data.value === undefined || to.params.camp !== from.params.camp) {
      const campId = to.params.camp as string;
      await fetchData(campId);

      bus.emit('change', data.value);
      return;
    }
  });

  async function fetchData(id?: string) {
    const campId = id ?? (route.params.camp as string);

    const cid = checkNotNullWithError(campId);
    await errorOnFailure(async () => {
      return await api.fetchCamp(cid);
    });
  }

  async function updateData(newData: Camp) {
    const campId =
      newData.id ?? data.value?.id ?? (route.params.camp as string);

    checkNotNullWithError(campId);

    await withProgressNotification('update', async () => {
      const updatedCamp = await api.updateCamp(campId, newData);

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
    });

    if (success) {
      await fetchData();

      bus.emit('delete', cid);

      // TODO Update route
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
