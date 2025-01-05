import { acceptHMRUpdate, defineStore } from 'pinia';
import type {
  Camp,
  CampCreateData,
  CampUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';

export const useCampsStore = defineStore('camps', () => {
  const apiService = useAPIService();
  const bus = useCampBus();
  const authBus = useAuthBus();
  const {
    data,
    isLoading,
    error,
    reset,
    withProgressNotification,
    lazyFetch,
    checkNotNullWithNotification,
  } = useServiceHandler<Camp[]>('camp');

  authBus.on('logout', () => {
    reset();
  });

  bus.on('create', (camp) => {
    data.value?.push(camp);
  });

  bus.on('update', (camp) => {
    data.value = data.value?.map((value) =>
      value.id === camp.id ? camp : value,
    );
  });

  bus.on('delete', (campId) => {
    data.value = data.value?.filter((camp) => camp.id !== campId);
  });

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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCampsStore, import.meta.hot));
}
