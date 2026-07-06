import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useCampBus } from '@/composables/bus';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import type {
  CampManager,
  CampManagerCreateData,
  CampManagerUpdateData,
} from '@camp-registration/common/entities';

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
  } = useServiceHandler<CampManager[]>('campManager');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients. List mode (no per-id
  // endpoint): every event collapses into one debounced list refetch.
  useRealtimeCollection<CampManager>('manager', {
    data,
    invalidate,
    reload: async () => {
      invalidate();
      await fetchData();
    },
  });

  async function fetchData(campId?: string) {
    campId ??= route.params.campId as string;

    const cid = checkNotNullWithError(campId);
    await lazyFetch(async () => {
      return await api.fetchCampManagers(cid);
    });
  }

  async function createData(newData: CampManagerCreateData) {
    const campId = route.params.campId as string;

    checkNotNullWithError(campId);

    await withProgressNotification('create', async () => {
      const campManager = await api.createCampManager(campId, newData);

      data.value?.push(campManager);
    });
  }

  async function updateData(
    managerId: string,
    updateData: CampManagerUpdateData,
  ) {
    const campId = route.params.campId as string;

    checkNotNullWithError(campId);
    checkNotNullWithNotification(managerId);

    await withProgressNotification('update', async () => {
      const manager = await api.updateCampManager(
        campId,
        managerId,
        updateData,
      );

      data.value = data.value?.map((value) =>
        value.id === manager.id ? manager : value,
      );
    });
  }

  async function deleteData(managerId: string) {
    const campId = route.params.campId as string;

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
