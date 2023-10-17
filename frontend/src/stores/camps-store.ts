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
    errorOnFailure,
    checkNotNullWithNotification,
  } = useServiceHandler<Camp[]>('camp');

  authBus.on('logout', () => {
    reset();
  });

  async function fetchData() {
    await errorOnFailure(async () => {
      return await apiService.fetchCamps();
    });
  }

  async function createEntry(createData: CampCreateData): Promise<void> {
    const success = await withProgressNotification('update', async () => {
      const newCamp = await apiService.createCamp(createData);

      bus.emit('create', newCamp);
    });

    if (success) {
      await fetchData();
    }
  }

  async function updateEntry(id: string, updateData: Partial<Camp>) {
    checkNotNullWithNotification(id);
    const success = await withProgressNotification('update', async () => {
      const updatedCamp = await apiService.updateCamp(id, updateData);

      bus.emit('update', updatedCamp);
    });

    if (success) {
      await fetchData();
    }
  }

  async function deleteEntry(id: string) {
    checkNotNullWithNotification(id);
    const success = await withProgressNotification('delete', async () => {
      await apiService.deleteCamp(id);
    });

    if (success) {
      data.value = data.value?.filter((camp) => camp.id !== id);

      if (campStore.data?.id === id) {
        campStore.reset();
      }
    }
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
