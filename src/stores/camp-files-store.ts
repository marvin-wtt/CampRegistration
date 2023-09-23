import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { FileUploadPayload, ServiceFile } from 'src/types/ServiceFile';
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
  } = useServiceHandler<ServiceFile[]>('camp.files');

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
    createData: FileUploadPayload,
    campId?: string,
  ): Promise<void> {
    campId = campId ?? (route.params.camp as string);
    const cid = checkNotNullWithNotification(campId);

    await withProgressNotification('create', async () => {
      const file = await apiService.createCampFile(cid, createData);

      data.value?.push(file);
    });
  }

  async function deleteEntry(id: string, campId?: string) {
    campId = campId ?? (route.params.camp as string);
    const cid = checkNotNullWithNotification(campId);
    checkNotNullWithNotification(id);
    const success = await withProgressNotification('delete', async () => {
      await apiService.deleteCampFile(cid, id);
    });

    if (success) {
      data.value = data.value?.filter((file) => file.id !== id);

      if (campStore.data?.id === id) {
        campStore.reset();
      }
    }
  }

  async function downloadData(id: string, campId?: string) {
    campId = campId ?? (route.params.camp as string);
    const cid = checkNotNullWithNotification(campId);
    checkNotNullWithNotification(id);

    await apiService.downloadCampFile(cid, id);
  }

  return {
    reset,
    data,
    isLoading,
    error,
    downloadData,
    fetchData,
    createEntry,
    deleteEntry,
  };
});
