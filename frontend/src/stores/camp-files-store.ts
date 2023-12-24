import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { useCampDetailsStore } from 'stores/camp-details-store';
import {
  ServiceFileCreateData,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useRoute } from 'vue-router';

export const useCampFilesStore = defineStore('campFiles', () => {
  const apiService = useAPIService();
  const campStore = useCampDetailsStore();
  const campBus = useCampBus();
  const authBus = useAuthBus();
  const route = useRoute();
  const {
    data,
    isLoading,
    error,
    reset,
    withProgressNotification,
    errorOnFailure,
    checkNotNullWithNotification,
    checkNotNullWithError,
  } = useServiceHandler<ServiceFile[]>('campFiles');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    reset();
  });

  async function fetchData(campId?: string) {
    campId = campId ?? (route.params.camp as string);
    const cid = checkNotNullWithError(campId);

    await errorOnFailure(async () => {
      return await apiService.fetchCampFiles(cid);
    });
  }

  async function createEntry(
    createData: ServiceFileCreateData,
    campId?: string,
  ): Promise<ServiceFile | undefined> {
    campId = campId ?? (route.params.camp as string);
    const cid = checkNotNullWithNotification(campId);

    return withProgressNotification('create', async () => {
      const file = await apiService.createCampFile(cid, createData);

      data.value?.push(file);

      return file;
    });
  }

  async function deleteEntry(id: string, campId?: string) {
    campId = campId ?? (route.params.camp as string);
    const cid = checkNotNullWithNotification(campId);
    checkNotNullWithNotification(id);
    await withProgressNotification('delete', async () => {
      await apiService.deleteCampFile(cid, id);

      data.value = data.value?.filter((file) => file.id !== id);

      if (campStore.data?.id === id) {
        campStore.reset();
      }
    });
  }

  async function downloadData(id: string, campId?: string) {
    campId = campId ?? (route.params.camp as string);
    const cid = checkNotNullWithNotification(campId);
    checkNotNullWithNotification(id);

    await apiService.downloadCampFile(cid, id);
  }

  function getUrl(id: string, campId?: string) {
    campId = campId ?? (route.params.camp as string);
    const cid = checkNotNullWithNotification(campId);
    checkNotNullWithNotification(id);

    return apiService.getCampFileUrl(cid, id);
  }

  return {
    reset,
    data,
    isLoading,
    error,
    downloadData,
    getUrl,
    fetchData,
    createEntry,
    deleteEntry,
  };
});
