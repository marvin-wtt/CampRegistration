import { defineStore } from 'pinia';
import type {
  TableTemplate,
  TableTemplateCreateData,
  TableTemplateUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { settleAll } from '@/composables/action';
import { removeById, replaceById, upsertById } from '@/utils/collection';

interface TemplateChanges {
  added: TableTemplate[];
  modified: TableTemplate[];
  removed: TableTemplate[];
}

function diffTemplates(
  current: readonly TableTemplate[],
  next: TableTemplate[],
): TemplateChanges {
  const byId = new Map(current.map((template) => [template.id, template]));
  return {
    added: next.filter((template) => !byId.has(template.id)),
    modified: next.filter((template) => {
      const before = byId.get(template.id);
      return (
        before !== undefined &&
        JSON.stringify(before) !== JSON.stringify(template)
      );
    }),
    // Generated templates belong to the server and are never deleted here.
    removed: current.filter(
      (template) =>
        !template.generated && !next.some((n) => n.id === template.id),
    ),
  };
}

export const useTemplateStore = defineStore('templates', () => {
  const api = useAPIService();
  const templates = useCollection<TableTemplate>({
    name: 'template',
    key: useRouteKey('eventId'),
    fetch: async (eventId) =>
      (await api.fetchTableTemplates(eventId)).sort(
        (a, b) => a.order - b.order,
      ),
    // List mode: a template sync fans out many create/update/delete calls,
    // so remote clients coalesce the burst into one debounced refetch.
    realtime: { resource: 'table_template' },
  });

  function fetchData(eventId?: string) {
    return templates.load(eventId);
  }

  // Saves the whole edited set at once. The server derives parts of the
  // templates, so the list is reloaded afterwards — on failure by mutate.
  async function updateCollection(next: TableTemplate[]): Promise<void> {
    const current = templates.data.value;
    if (current === undefined) {
      return;
    }

    const { added, modified, removed } = diffTemplates(current, next);
    await templates.mutate(
      'update',
      (eventId, report) =>
        settleAll<unknown>(
          [
            ...added.map((t) => () => api.createTableTemplate(eventId, t)),
            ...modified.map(
              (t) => () => api.updateTableTemplate(eventId, t.id, t),
            ),
            ...removed.map((t) => () => api.deleteTableTemplate(eventId, t.id)),
          ],
          report,
        ),
      { feedback: 'progress' },
    );
    await templates.reload();
  }

  function createEntry(
    template: TableTemplateCreateData,
    eventId?: string,
  ): Promise<TableTemplate> {
    return templates.mutate(
      'create',
      (key) => api.createTableTemplate(key, template),
      {
        feedback: 'progress',
        apply: upsertById,
        ...(eventId ? { key: eventId } : {}),
      },
    );
  }

  function updateEntry(
    templateId: string,
    template: TableTemplateUpdateData,
  ): Promise<TableTemplate> {
    return templates.mutate(
      'update',
      (eventId) => api.updateTableTemplate(eventId, templateId, template),
      { feedback: 'progress', apply: replaceById },
    );
  }

  async function deleteEntry(templateId: string): Promise<void> {
    await templates.mutate(
      'delete',
      (eventId) => api.deleteTableTemplate(eventId, templateId),
      { feedback: 'progress', apply: (list) => removeById(list, templateId) },
    );
  }

  return {
    data: templates.data,
    isLoading: templates.isLoading,
    error: templates.error,
    reset: templates.reset,
    fetchData,
    createEntry,
    updateEntry,
    deleteEntry,
    updateCollection,
  };
});
