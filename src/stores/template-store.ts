import { defineStore } from 'pinia';
import { ref } from 'vue';
import { TableTemplate } from 'src/types/TableTemplate';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAPIService } from 'src/services/APIService';
import { useNotification } from 'src/composables/notifications';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { Camp } from 'src/types/Camp';

export const useTemplateStore = defineStore('resultTemplate', () => {
  const route = useRoute();
  const { t } = useI18n();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const campBus = useCampBus();
  const { withMultiProgressNotification, withProgressNotification } =
    useNotification();

  const data = ref<TableTemplate[] | undefined>();
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
    }

    isLoading.value = false;
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

    const success = await withMultiProgressNotification(results, {
      progress: {
        message: t('stores.template.update.progress'),
      },
      error: {
        message: t('stores.template.update.error'),
      },
      success: {
        message: t('stores.template.update.success'),
      },
    });

    if (success) {
      // Always update store because of partial updates
      await fetchData();
    }
  }

  async function createEntry(template: TableTemplate) {
    const campId = route.params.camp as string | undefined;

    if (campId === undefined) {
      // TODO Notify error
      return;
    }

    const success = await withProgressNotification(
      async () => {
        await apiService.createResultTemplate(campId, template);
      },
      {
        progress: {
          message: t('stores.template.create.progress'),
        },
        success: {
          message: t('stores.template.create.success'),
        },
        error: {
          message: t('stores.template.create.error'),
        },
      }
    );

    // Fetch data again because it updated
    if (success) {
      await fetchData();
    }
  }

  async function updateEntry(template: TableTemplate) {
    const campId = route.params.camp as string | undefined;

    if (campId === undefined) {
      // TODO Notify error
      return;
    }

    const success = await withProgressNotification(
      async () => {
        await apiService.updateResultTemplate(campId, template.id, template);
      },
      {
        progress: {
          message: t('stores.template.update.progress'),
        },
        success: {
          message: t('stores.template.update.success'),
        },
        error: {
          message: t('stores.template.update.error'),
        },
      }
    );

    // Fetch data again because it updated
    if (success) {
      await fetchData(template.id);
    }
  }

  async function deleteEntry(id: string) {
    const campId = route.params.camp as string | undefined;

    if (campId === undefined) {
      // TODO Notify error
      return;
    }

    const success = await withProgressNotification(
      async () => {
        await apiService.deleteResultTemplate(campId, id);
      },
      {
        progress: {
          message: t('stores.template.delete.progress'),
        },
        success: {
          message: t('stores.template.delete.success'),
        },
        error: {
          message: t('stores.template.delete.error'),
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
    createEntry,
    updateEntry,
    deleteEntry,
    updateCollection,
  };
});
