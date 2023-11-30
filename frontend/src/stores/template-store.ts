import { defineStore } from 'pinia';
import { TableTemplate } from 'src/types/TableTemplate';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';

export const useTemplateStore = defineStore('templates', () => {
  const route = useRoute();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const campBus = useCampBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withProgressNotification,
    withMultiProgressNotification,
    lazyFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<TableTemplate[]>('template');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  // TODO Items:
  //  federal_licence_id
  //  (legal_guardian_permission_fly)
  //  (legal_guardian_permission_written_consent)
  //  language_skills

  async function forceFetchData(id?: string) {
    invalidate();
    return fetchData(id);
  }

  async function fetchData(id?: string) {
    const campId = id ?? (route.params.camp as string | undefined);

    const cid = checkNotNullWithError(campId);
    await lazyFetch(async () => {
      const data = await apiService.fetchResultTemplates(cid);
      return data.sort((a, b) => {
        return a.order - b.order;
      });
    });
  }

  async function updateCollection(templates: TableTemplate[]) {
    const currentTemplates = data.value;

    const campId = route.params.camp as string | undefined;

    const cid = checkNotNullWithError(campId);

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

    const results: Promise<TableTemplate | void>[] = [];

    for (const t of added) {
      results.push(apiService.createResultTemplate(cid, t));
    }

    for (const t of modified) {
      results.push(apiService.updateResultTemplate(cid, t.id, t));
    }

    for (const t of removed) {
      results.push(apiService.deleteResultTemplate(cid, t.id));
    }

    await withMultiProgressNotification(results, 'update');

    // Always force update because a partial update could happen
    await forceFetchData();
  }

  async function createEntry(template: TableTemplate) {
    const campId = route.params.camp as string | undefined;

    const cid = checkNotNullWithError(campId);
    return await withProgressNotification('create', async () => {
      const result = await apiService.createResultTemplate(cid, template);

      // Add item to data
      data.value?.push(result);

      return result;
    });
  }

  async function updateEntry(template: TableTemplate) {
    const campId = route.params.camp as string | undefined;

    const cid = checkNotNullWithError(campId);
    return await withProgressNotification('update', async () => {
      const result = await apiService.updateResultTemplate(
        cid,
        template.id,
        template,
      );

      // Replace item in data
      data.value = data.value?.map((value) =>
        value.id === template.id ? result : value,
      );

      return result;
    });
  }

  async function deleteEntry(id: string) {
    const campId = route.params.camp as string | undefined;

    const cid = checkNotNullWithError(campId);
    const tid = checkNotNullWithNotification(id);
    return await withProgressNotification('delete', async () => {
      const result = apiService.deleteResultTemplate(cid, tid);

      // Remove item from data
      data.value = data.value?.filter((value) => value.id === id);

      return result;
    });
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
