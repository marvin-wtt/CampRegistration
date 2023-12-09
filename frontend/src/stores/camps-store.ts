import { defineStore } from 'pinia';
import { Camp, CampCreateData } from 'src/types/Camp';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { useCampDetailsStore } from 'stores/camp-details-store';

export const useCampsStore = defineStore('camps', () => {
  const apiService = useAPIService();
  const campStore = useCampDetailsStore();
  const bus = useCampBus();
  const authBus = useAuthBus();
  const {
    data,
    isLoading,
    error,
    reset,
    withProgressNotification,
    forceFetch,
    lazyFetch,
    checkNotNullWithNotification,
  } = useServiceHandler<Camp[]>('camp');

  authBus.on('logout', () => {
    reset();
  });

  async function fetchData() {
    return lazyFetch(async () => await apiService.fetchCamps());
  }

  async function createEntry(
    createData: CampCreateData,
  ): Promise<Camp | undefined> {
    return withProgressNotification('update', async () => {
      const newCamp = await apiService.createCamp(createData);

      await forceFetch(async () => await apiService.fetchCamps());

      bus.emit('create', newCamp);

      return newCamp;
    });
  }

  async function updateEntry(
    id: string,
    updateData: Partial<Camp>,
  ): Promise<Camp | undefined> {
    checkNotNullWithNotification(id);
    return withProgressNotification('update', async () => {
      const updatedCamp = await apiService.updateCamp(id, updateData);

      await forceFetch(async () => await apiService.fetchCamps());

      bus.emit('update', updatedCamp);

      return updatedCamp;
    });
  }

  async function deleteEntry(id: string) {
    checkNotNullWithNotification(id);
    await withProgressNotification('delete', async () => {
      await apiService.deleteCamp(id);

      data.value = data.value?.filter((camp) => camp.id !== id);

      if (campStore.data?.id === id) {
        campStore.reset();
      }

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
