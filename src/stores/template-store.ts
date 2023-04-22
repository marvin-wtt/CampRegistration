import { defineStore } from 'pinia';
import { ref } from 'vue';
import { TableTemplate } from 'src/types/TableTemplate';

import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAPIService } from 'src/services/APIService';

export const useTemplateStore = defineStore('resultTemplate', () => {
  const route = useRoute();
  const router = useRouter();
  const quasar = useQuasar();
  const { t } = useI18n();
  const apiService = useAPIService();

  const data = ref<TableTemplate[] | undefined>();
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

  function reset() {
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
  }

  // TODO Items:
  //  federal_licence_id
  //  (legal_guardian_permission_fly)
  //  (legal_guardian_permission_written_consent)
  //  language_skills

  async function fetchData(id?: string) {
    isLoading.value = true;
    error.value = null;

    const campId = id ?? (route.params.camp as string | undefined);
    if (campId === undefined) {
      error.value = '404';
      isLoading.value = false;
      return;
    }

    try {
      data.value = await apiService.fetchResultTemplates(campId);
      data.value.sort((a, b) => {
        return a.order - b.order;
      });
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

  async function updateCollection(templates: TableTemplate[]) {
    const currentTemplates = data.value;

    const campId = route.params.camp as string | undefined;

    if (campId === undefined) {
      // TODO notify
      return;
    }

    if (currentTemplates === undefined) {
      // TODO notify
      return;
    }

    // Extract all new elements that were not there before
    const added = templates.filter((update) => {
      return currentTemplates.every((template) => {
        return template.id !== update.id;
      });
    });

    // Extract all elements that were deleted
    const removed = currentTemplates.filter((template) => {
      if (template.generated) {
        return false;
      }

      return !templates.some((update) => {
        return template.id === update.id;
      });
    });

    // Extract all elements that were updated
    const modified = templates.filter((update) => {
      const template = currentTemplates.find((v) => v.id === update.id);

      return (
        template !== undefined &&
        JSON.stringify(template) !== JSON.stringify(update)
      );
    });

    const results: Promise<void>[] = [];

    for (const t of added) {
      results.push(apiService.createResultTemplate(campId, t));
    }

    for (const t of modified) {
      results.push(apiService.updateResultTemplate(campId, t.id, t));
    }

    for (const t of removed) {
      results.push(apiService.deleteResultTemplate(campId, t.id));
    }

    // TODO Add translation
    const progressNotify = quasar.notify({
      group: false,
      position: 'top',
      timeout: 0,
      spinner: true,
      message: t('notification.progress'),
      caption: '0 %',
    });

    try {
      let doneCounter = 0;
      for (const result of results) {
        result.then(() => {
          doneCounter++;
          const percentage = Math.floor((doneCounter / results.length) * 100);

          progressNotify({
            caption: `${percentage} %`,
          });
        });
      }

      await Promise.all(results);

      // TODO Add translation
      progressNotify({
        type: 'positive',
        spinner: false,
        message: t('notification.done'),
        timeout: 2500,
      });
    } catch (error: unknown) {
      progressNotify({
        type: 'negative',
        spinner: false,
        message: t('notification.done'),
        caption: '',
        timeout: 2500,
      });
    }

    // Always update store because of partial updates
    await fetchData();
  }

  async function createEntry(template: TableTemplate) {
    // TODO create template
  }

  async function updateEntry(template: TableTemplate) {
    // TODO update template
  }

  async function deleteEntry(id: string) {
    // TODO delete template
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
    updateCollection,
  };
});
