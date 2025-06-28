import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { useCampDetailsStore } from 'stores/camp-details-store';
import type {
  ServiceFileCreateData,
  ServiceFile,
} from '@camp-registration/common/entities';
import { exportFile } from 'quasar';

export const useCampFilesStore = defineStore('campFiles', () => {
  const apiService = useAPIService();
  const campStore = useCampDetailsStore();
  const campBus = useCampBus();
  const authBus = useAuthBus();
  const {
    data,
    isLoading,
    error,
    reset,
    withProgressNotification,
    withErrorNotification,
    checkNotNullWithNotification,
    queryParam,
    lazyFetch,
  } = useServiceHandler<ServiceFile[]>('campFiles');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', (_camp, oldCamp) => {
    // Prevent reset when this is the initial page load
    if (!oldCamp) {
      return;
    }

    reset();
  });

  async function fetchData() {
    const campId = queryParam('camp');

    await lazyFetch(async () => {
      return await apiService.fetchCampFiles(campId);
    });
  }

  async function createEntry(
    createData: ServiceFileCreateData,
    options?: { withoutNotifications: boolean },
  ): Promise<ServiceFile> {
    const campId = queryParam('camp');

    const createFn = async () => {
      const file = await apiService.createCampFile(campId, createData);

      data.value?.push(file);

      return file;
    };

    return options?.withoutNotifications
      ? createFn()
      : withProgressNotification('create', createFn);
  }

  async function deleteEntry(id: string) {
    const campId = queryParam('camp');

    await withProgressNotification('delete', async () => {
      await apiService.deleteCampFile(campId, id);

      data.value = data.value?.filter((file) => file.id !== id);

      if (campStore.data?.id === id) {
        campStore.reset();
      }
    });
  }

  async function downloadFile(file: ServiceFile) {
    await withErrorNotification('download', async () => {
      const blob = await apiService.downloadFile(file.id);

      exportFile(file.name, blob, {
        mimeType: file.type,
      });
    });
  }

  function getUrl(id: string) {
    checkNotNullWithNotification(id);

    return apiService.getFileUrl(id);
  }

  return {
    reset,
    data,
    isLoading,
    error,
    downloadFile,
    getUrl,
    fetchData,
    createEntry,
    deleteEntry,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCampFilesStore, import.meta.hot));
}
