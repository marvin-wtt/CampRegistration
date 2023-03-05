import { defineStore } from 'pinia';
import { ref } from 'vue';
import { TableTemplate } from 'src/types/TableTemplate';

import templates from 'src/lib/example/resultTableTemplates.json';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAPIService } from 'src/services/APIService';

export const useResultTemplateStore = defineStore('resultTemplate', () => {
  const route = useRoute();
  const quasar = useQuasar();
  const { t } = useI18n();
  const apiService = useAPIService();

  const data = ref<TableTemplate[] | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // TODO Items:
  //  federal_licence_id
  //  (legal_guardian_permission_fly)
  //  (legal_guardian_permission_written_consent)
  //  language_skills

  async function fetchData() {
    isLoading.value = true;
    error.value = null;

    const campId = route.params.camp as string;
    if (campId === undefined) {
      error.value = '404';
      return;
    }

    // TODO Remove
    if (campId === 'd81301ae-9f57-419d-a5a7-f9b2f0c6') {
      data.value = templates as TableTemplate[];
      isLoading.value = false;
      return;
    }

    try {
      data.value = await apiService.fetchResultTemplates(campId);
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

  return {
    data,
    isLoading,
    error,
    fetchTemplates: fetchData,
  };
});
