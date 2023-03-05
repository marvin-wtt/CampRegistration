import { defineStore } from 'pinia';
import { ref } from 'vue';

import camp from 'src/lib/example/camp.json';
import { Camp } from 'src/types/Camp';
import { useAPIService } from 'src/services/APIService';

export const useCampsStore = defineStore('camps', () => {
  const apiService = useAPIService();

  const data = ref<Camp[]>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchData() {
    isLoading.value = true;
    error.value = null;

    // TODO remove
    data.value = [camp];
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

  async function deleteEntry(id: string) {
    try {
      await apiService.deleteCamp(id);
    } catch (e: unknown) {
      // TODO Error handling
    }
    await fetchData();
  }

  async function updateEntry(id: string, data: Partial<Camp>) {
    try {
      await apiService.updateCamp(id, data);
    } catch (e: unknown) {
      // TODO Error handling
    }
    await fetchData();
  }

  return {
    data,
    isLoading,
    error,
    fetchData,
    deleteEntry,
    updateEntry,
  };
});
