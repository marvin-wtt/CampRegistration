import { defineStore } from 'pinia';
import { ref } from 'vue';

import camp from 'src/lib/example/camp.json';
import { Camp } from 'src/types/Camp';
import { useAPIService } from 'src/services/APIService';
import { useQuasar } from 'quasar';
import { useCampDetailsStore } from 'stores/camp/camp-details-store';

export const useCampsStore = defineStore('camps', () => {
  const quasar = useQuasar();
  const apiService = useAPIService();

  const data = ref<Camp[]>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchData() {
    isLoading.value = true;
    error.value = null;

    // TODO remove
    data.value = [camp] as Camp[];
    isLoading.value = false;
    return;

    // try {
    //   const response = await axios.get(`${API_SERVER}/camps/`);
    //   data.value = await response.data;
    // } catch (e: unknown) {
    //   error.value = e instanceof Error
    //     ? e.message
    //     : typeof e === 'string'
    //       ? e
    //       : 'error';
    // } finally {
    //   isLoading.value = false;
    // }
  }

  async function createEntry(data: Camp): Promise<void> {
    // TODO Translate errors
    try {
      await apiService.createCamp(data);
      quasar.notify({
        type: 'positive',
        position: 'top',
        message: 'Camp created',
      });
    } catch (e: unknown) {
      quasar.notify({
        type: 'negative',
        position: 'top',
        message: 'Some error',
      });
    }
    // Update data after create
    await fetchData();
  }

  async function updateEntry(id: string, data: Partial<Camp>) {
    // TODO Translate errors
    try {
      await apiService.updateCamp(id, data);
      quasar.notify({
        type: 'positive',
        position: 'top',
        message: 'Camp created',
      });
    } catch (e: unknown) {
      quasar.notify({
        type: 'negative',
        position: 'top',
        message: 'Some error',
      });
    }
    // Update camps
    await fetchData();
    // Update camp details store
    const campStore = useCampDetailsStore();
    if (campStore.data?.id === id) {
      await campStore.fetchData();
    }
  }

  async function deleteEntry(id: string) {
    // TODO Translate errors
    try {
      await apiService.deleteCamp(id);
      quasar.notify({
        type: 'positive',
        position: 'top',
        message: 'Camp created',
      });
    } catch (e: unknown) {
      quasar.notify({
        type: 'negative',
        position: 'top',
        message: 'Some error',
      });
    }
    await fetchData();
    // Update camp details store
    const campStore = useCampDetailsStore();
    if (campStore.data?.id === id) {
      await campStore.$reset();
    }
  }

  return {
    data,
    isLoading,
    error,
    fetchData,
    createEntry,
    updateEntry,
    deleteEntry,
  };
});
