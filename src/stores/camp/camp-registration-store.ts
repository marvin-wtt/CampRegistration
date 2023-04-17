import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { messages } from 'stores/camp/camp-registration-translations';

import { useAPIService } from 'src/services/APIService';
import { Registration } from 'src/types/Registration';

export const useCampRegistrationsStore = defineStore(
  'campRegistrations',
  () => {
    const route = useRoute();
    const router = useRouter();
    const quasar = useQuasar();
    const { t } = useI18n({ messages: messages });
    const apiService = useAPIService();

    const data = ref<Registration[]>();
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    // TODO Should this even happen here?
    router.beforeEach((to, from) => {
      if (to.params.camp === undefined) {
        return;
      }

      // TODO Only fetch for result routes - not camp.
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
        data.value = await apiService.fetchRegistrations(campId);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'error';

        quasar.notify({
          type: 'negative',
          message: t('fetch.error'),
          position: 'top',
        });
      } finally {
        isLoading.value = false;
      }
    }

    // TODO on logout
    function clearData() {
      data.value = undefined;
      isLoading.value = false;
      error.value = null;
    }

    async function updateData(
      registrationId: string | undefined,
      data: Partial<Registration>
    ) {
      const campId = route.params.camp as string;

      if (campId === undefined || registrationId === undefined) {
        quasar.notify({
          type: 'negative',
          message: t('update.invalid'),
          position: 'top',
        });
        return;
      }

      try {
        await apiService.updateRegistration(campId, registrationId, data);

        quasar.notify({
          type: 'positive',
          message: t('update.success'),
          position: 'top',
        });
      } catch (e: unknown) {
        quasar.notify({
          type: 'negative',
          message: t('update.error'),
          position: 'top',
        });
      } finally {
        // Fetch data again because it updated
        await fetchData();
      }
    }

    async function deleteData(registrationId?: string) {
      const campId = route.params.camp as string;

      if (campId === undefined || registrationId === undefined) {
        quasar.notify({
          type: 'negative',
          message: t('delete.invalid'),
          position: 'top',
        });
        return;
      }

      try {
        await apiService.deleteRegistration(campId, registrationId);

        quasar.notify({
          type: 'positive',
          message: t('delete.success'),
          position: 'top',
        });
      } catch (e: unknown) {
        quasar.notify({
          type: 'negative',
          message: t('delete.error'),
          position: 'top',
        });
      } finally {
        await fetchData();
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
  }
);
