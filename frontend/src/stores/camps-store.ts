import { defineStore } from 'pinia';
import type {
  Camp,
  CampCreateData,
  CampUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useCampBus } from 'src/composables/bus';

export const useCampsStore = defineStore('camps', () => {
  const apiService = useAPIService();
  const bus = useCampBus();
  const {
    data,
    isLoading,
    error,
    reset,
    withProgressNotification,
    lazyFetch,
    checkNotNullWithNotification,
  } = useServiceHandler<Camp[]>('camp');

  // Always fetch again since the permissions could have changed
  bus.on('create', reload);
  bus.on('update', reload);
  bus.on('delete', reload);

  async function reload() {
    reset();
    return fetchData();
  }

  async function fetchData() {
    return lazyFetch(async () => await apiService.fetchCamps());
  }

  async function createEntry(createData: CampCreateData): Promise<Camp> {
    return withProgressNotification('update', async () => {
      const newCamp = await apiService.createCamp(createData);

      bus.emit('create', newCamp);

      return newCamp;
    });
  }

  async function updateEntry(
    id: string,
    updateData: CampUpdateData,
  ): Promise<Camp | undefined> {
    checkNotNullWithNotification(id);
    return withProgressNotification('update', async () => {
      const updatedCamp = await apiService.updateCamp(id, updateData);

      bus.emit('update', updatedCamp);

      return updatedCamp;
    });
  }

  async function deleteEntry(id: string) {
    checkNotNullWithNotification(id);
    await withProgressNotification('delete', async () => {
      await apiService.deleteCamp(id);

      bus.emit('delete', id);
    });
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    createEntry,
    updateEntry,
    deleteEntry,
  };
});
