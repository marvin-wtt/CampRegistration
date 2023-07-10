import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { CampManager } from 'src/types/CampManager';

export const useCampManagerStore = defineStore('campManager', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const campBus = useCampBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withProgressNotification,
    lazyFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<CampManager[]>('camp-manager');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  async function fetchData(campId?: string) {
    campId ??= route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    await lazyFetch(async () => {
      return await api.fetchCampManagers(cid);
    });
  }

  async function createData(email: string) {
    const campId = route.params.camp as string;

    checkNotNullWithError(campId);
    checkNotNullWithNotification(email);

    await withProgressNotification('create', async () => {
      const campManager = await api.createCampManager(campId, email);

      data.value?.push(campManager);
    });
  }

  async function updateData(managerId: string, role: string) {
    const campId = route.params.camp as string;

    checkNotNullWithError(campId);
    checkNotNullWithNotification(managerId);
    checkNotNullWithNotification(role);

    // TODO Call service
  }

  async function deleteData(managerId: string) {
    const campId = route.params.camp as string;

    checkNotNullWithError(campId);
    checkNotNullWithNotification(managerId);

    await withProgressNotification('delete', async () => {
      await api.deleteCampManager(campId, managerId);

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
