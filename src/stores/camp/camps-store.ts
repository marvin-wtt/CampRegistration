import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Camp } from 'src/types/Camp';
import { useAPIService } from 'src/services/APIService';
import { useCampDetailsStore } from 'stores/camp/camp-details-store';
import { useAuthStore } from 'stores/auth-store';
import { useNotification } from 'src/composables/notifications';
import { useI18n } from 'vue-i18n';

export const useCampsStore = defineStore('camps', () => {
  const apiService = useAPIService();
  const { t } = useI18n();
  const { withProgressNotification } = useNotification();

  const data = ref<Camp[]>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  function reset() {
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
  }

  async function fetchData() {
    isLoading.value = true;
    error.value = null;

    try {
      data.value = await apiService.fetchCamps();
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'error';
    }

    isLoading.value = false;
  }

  async function refreshStores(id?: string) {
    // Update camps
    await fetchData();
    // Update user camps
    await useAuthStore().fetchData();
    // Update camp details store
    const campStore = useCampDetailsStore();
    if (id && campStore.data?.id === id) {
      await campStore.fetchData();
    }
  }

  async function createEntry(data: Camp): Promise<void> {
    const success = await withProgressNotification(
      async () => {
        await apiService.createCamp(data);
      },
      {
        progress: {
          message: t('store.camp.create.progress'),
        },
        success: {
          message: t('store.camp.create.success'),
        },
        error: {
          message: t('store.camp.create.error'),
        },
      }
    );

    if (!success) {
      return;
    }
    // Update data after create
    await refreshStores();
  }

  async function updateEntry(id: string, data: Partial<Camp>) {
    const success = await withProgressNotification(
      async () => {
        await apiService.updateCamp(id, data);
      },
      {
        progress: {
          message: t('stores.camp.update.progress'),
        },
        success: {
          message: t('stores.camp.update.success'),
        },
        error: {
          message: t('stores.camp.update.error'),
        },
      }
    );

    if (!success) {
      return;
    }

    await refreshStores();
  }

  async function deleteEntry(id: string) {
    const success = await withProgressNotification(
      async () => {
        await apiService.deleteCamp(id);
      },
      {
        progress: {
          message: t('stores.camp.delete.progress'),
        },
        success: {
          message: t('stores.camp.delete.success'),
        },
        error: {
          message: t('stores.camp.delete.error'),
        },
      }
    );

    if (!success) {
      return;
    }

    await refreshStores();
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
