import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAPIService } from 'src/services/APIService';
import { Registration } from 'src/types/Registration';
import { useNotification } from 'src/composables/notifications';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { Camp } from 'src/types/Camp';

export const useCampRegistrationsStore = defineStore('registrations', () => {
  const route = useRoute();
  const quasar = useQuasar();
  const { t } = useI18n();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const campBus = useCampBus();
  const { withProgressNotification } = useNotification();

  const data = ref<Registration[]>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', async (camp: Camp) => {
    await fetchData(camp.id);
  });

  function reset() {
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
  }

  async function fetchData(campId?: string) {
    isLoading.value = true;
    error.value = null;

    campId = campId ?? (route.params.camp as string | undefined);
    if (campId === undefined) {
      error.value = '404';
      isLoading.value = false;
      return;
    }

    try {
      data.value = await apiService.fetchRegistrations(campId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'error';

      quasar.notify({
        type: 'negative',
        message: t('stores.registration.fetch.error'),
        position: 'top',
      });
    }

    isLoading.value = false;
  }

  async function updateData(
    registrationId: string | undefined,
    data: Partial<Registration>
  ) {
    const campId = route.params.camp as string;

    if (campId === undefined || registrationId === undefined) {
      quasar.notify({
        type: 'negative',
        message: t('stores.registration.update.invalid'),
        position: 'top',
      });
      return;
    }

    const success = await withProgressNotification(
      async () => {
        await apiService.updateRegistration(campId, registrationId, data);
      },
      {
        progress: {
          message: t('stores.registration.update.progress'),
        },
        success: {
          message: t('stores.registration.update.success'),
        },
        error: {
          message: t('stores.registration.update.error'),
        },
      }
    );

    // Fetch data again because it updated
    if (success) {
      await fetchData();
    }
  }

  async function deleteData(registrationId?: string) {
    const campId = route.params.camp as string;

    if (campId === undefined || registrationId === undefined) {
      quasar.notify({
        type: 'negative',
        message: t('stores.registration.delete.invalid'),
        position: 'top',
      });
      return;
    }

    const success = await withProgressNotification(
      async () => {
        await apiService.deleteRegistration(campId, registrationId);
      },
      {
        success: {
          message: t('stores.registration.delete.success'),
        },
        error: {
          message: t('stores.registration.delete.error'),
        },
      }
    );

    // Fetch data again because it updated
    if (success) {
      await fetchData();
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
