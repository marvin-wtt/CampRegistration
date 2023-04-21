import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Camp } from 'src/types/Camp';
import { useAPIService } from 'src/services/APIService';
import { useQuasar } from 'quasar';
import { useCampDetailsStore } from 'stores/camp/camp-details-store';
import { useAuthStore } from 'stores/auth-store';

export const useCampsStore = defineStore('camps', () => {
  const quasar = useQuasar();
  const api = useAPIService();

  const data = ref<Camp[]>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchData() {
    isLoading.value = true;
    error.value = null;

    try {
      data.value = await api.fetchCamps();
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'error';
    } finally {
      isLoading.value = false;
    }
  }

  async function createEntry(data: Camp): Promise<void> {
    // TODO Translate errors
    try {
      await api.createCamp(data);
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
      await api.updateCamp(id, data);
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
    await useAuthStore().fetchData();
  }

  async function deleteEntry(id: string) {
    // TODO Translate errors
    try {
      await api.deleteCamp(id);
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
