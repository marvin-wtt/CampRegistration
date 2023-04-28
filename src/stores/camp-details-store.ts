import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Camp } from 'src/types/Camp';
import { useAPIService } from 'src/services/APIService';
import { useNotification } from 'src/composables/notifications';
import { useTemplateStore } from 'stores/template-store';
import { useAuthBus, useCampBus } from 'src/composables/bus';

export const useCampDetailsStore = defineStore('campDetails', () => {
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const api = useAPIService();
  const templateStore = useTemplateStore();
  const bus = useCampBus();
  const authBus = useAuthBus();
  const { withProgressNotification } = useNotification();

  const data = ref<Camp>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  authBus.on('logout', () => {
    reset();
  });

  router.beforeEach(async (to, from) => {
    if (to.params.camp === undefined) {
      return;
    }

    if (data.value === undefined || to.params.camp !== from.params.camp) {
      const campId = to.params.camp as string;
      await fetchData(campId);

      bus.emit('change', data.value);
      return;
    }
  });

  function reset() {
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
  }

  async function fetchData(id?: string) {
    isLoading.value = true;
    error.value = null;

    const campId = id ?? (route.params.camp as string);
    if (campId === undefined) {
      error.value = '404'; // TODO Set meaningful error
      isLoading.value = false;
      return;
    }

    try {
      data.value = await api.fetchCamp(campId);
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'error';
    }

    isLoading.value = false;
  }

  async function updateData(newData: Camp) {
    const campId =
      newData.id ?? data.value?.id ?? (route.params.camp as string);

    const success = await withProgressNotification(
      async () => {
        await api.updateCamp(campId, newData);

        bus.emit('update');
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

    // Fetch data again because it updated
    if (success) {
      await fetchData(campId);
    }
  }

  async function deleteData(id?: string) {
    const campId = id ?? data.value?.id ?? (route.params.camp as string);

    await withProgressNotification(
      async () => {
        await api.deleteCamp(campId);
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

    // Reset current store if the camp was loaded
    if (id === data.value?.id) {
      reset();
      await templateStore.reset();
    }
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    updateData,
    deleteData,
  };
});
