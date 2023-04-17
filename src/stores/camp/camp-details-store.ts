import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { Camp } from 'src/types/Camp';
import { useAPIService } from 'src/services/APIService';

export const useCampDetailsStore = defineStore('campDetails', () => {
  const route = useRoute();
  const quasar = useQuasar();
  const router = useRouter();
  const { t } = useI18n({
    useScope: 'local',
    messages: {
      en: {
        fetch: {
          error: 'Failed to fetch camp',
        },
        update: {
          error: 'Failed to update camp',
          success: 'Camp updated successfully',
        },
        delete: {
          error: 'Failed to delete camp',
          success: 'Camp deleted successfully',
        },
      },
      de: {
        // TODO
      },
      fr: {
        // TODO
      },
    },
  });
  const api = useAPIService();

  const data = ref<Camp>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // TODO Should this even happen here?
  router.beforeEach((to, from) => {
    if (to.params.camp === undefined) {
      return;
    }

    if (data.value === undefined || to.params.camp !== from.params.camp) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ignored = fetchData(to.params.camp as string);
      return;
    }
  });

  async function fetchData(id?: string) {
    isLoading.value = true;
    error.value = null;

    const campId = id ?? (route.params.camp as string);
    if (campId === undefined) {
      error.value = '404';
      isLoading.value = false;
      return;
    }

    try {
      data.value = await api.fetchCamp(campId);
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'error';

      quasar.notify({
        type: 'negative',
        message: t('fetch.error'),
        position: 'top',
      });
    }

    isLoading.value = false;
  }

  async function updateData(newData: Camp) {
    const campId =
      newData.id ?? data.value?.id ?? (route.params.camp as string);

    try {
      await api.updateCamp(campId, newData);

      quasar.notify({
        type: 'positive',
        message: t('update.success'),
        position: 'top',
      });
    } catch (e: unknown) {
      // TODO Set error
      quasar.notify({
        type: 'negative',
        message: t('update.error'),
        position: 'top',
      });
    } finally {
      // Fetch data again because it updated
      await fetchData(campId);
    }
  }

  async function deleteData(id?: string) {
    const campId = id ?? data.value?.id ?? (route.params.camp as string);

    error.value = null;
    try {
      await api.deleteCamp(campId);
      data.value = undefined;
      quasar.notify({
        type: 'positive',
        group: 'camp-delete-success',
        message: t('delete.success'),
        position: 'top',
      });
    } catch (e: unknown) {
      // TODO Set error
      quasar.notify({
        type: 'negative',
        group: 'camp-delete-error',
        message: t('delete.error'),
        position: 'top',
      });
    } finally {
      isLoading.value = false;
    }
  }

  return {
    data,
    isLoading,
    error,
    fetchData,
    updateData,
    deleteData,
  };
});
