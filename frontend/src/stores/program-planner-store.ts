import { defineStore } from 'pinia';
import type {
  ProgramItem,
  ProgramItemCreateData,
  ProgramItemUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { useAction } from '@/composables/action';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import { createUuid } from '@/utils/uuid';
import { useI18n } from 'vue-i18n';

// Placeholders for items still being created carry a `#` id.
function isPlaceholder(id: string): boolean {
  return id.startsWith('#');
}

function placeholder(id: string, item: ProgramItemCreateData): ProgramItem {
  return {
    id,
    title: item.title,
    details: item.details ?? null,
    location: item.location ?? null,
    date: item.date ?? null,
    time: item.time ?? null,
    duration: item.duration ?? null,
    color: item.color ?? null,
    plan: item.plan ?? 'both',
  };
}

// Changes show in the calendar right away (for responsive drag-and-drop) and
// only failures are reported; a failed one is undone.
export const useProgramPlannerStore = defineStore('program-planner', () => {
  const api = useAPIService();
  const { t } = useI18n({ useScope: 'global' });
  const { run } = useAction('programPlanner');
  const items = useCollection<ProgramItem>({
    name: 'programPlanner',
    key: useRouteKey('eventId'),
    fetch: (eventId) => api.fetchProgramItems(eventId),
    realtime: {
      resource: 'program_item',
      fetchOne: (eventId, id) => api.fetchProgramItem(eventId, id),
    },
  });

  function fetchData(eventId?: string) {
    return items.load(eventId);
  }

  function createEntry(item: ProgramItemCreateData): Promise<ProgramItem> {
    const tmpId = `#${createUuid()}`;
    return items.mutate(
      'create',
      (eventId) => api.createProgramItem(eventId, item),
      {
        optimistic: (list) => [...list, placeholder(tmpId, item)],
        rollback: (list) => removeById(list, tmpId),
        // An upsert, as the realtime "created" echo may have inserted it.
        apply: (list, created) => upsertById(removeById(list, tmpId), created),
      },
    );
  }

  // A placeholder has no server id yet, so it can't be changed until created.
  function rejectPlaceholder(operation: string): Promise<never> {
    return run(operation, () =>
      Promise.reject(new Error(t('stores.programPlanner.pendingCreate'))),
    );
  }

  async function updateEntry(
    id: string,
    update: ProgramItemUpdateData,
  ): Promise<void> {
    if (isPlaceholder(id)) {
      return rejectPlaceholder('update');
    }

    await items.mutate(
      'update',
      (eventId) => api.updateProgramItem(eventId, id, update),
      {
        optimistic: (list) =>
          list.map((entry) =>
            entry.id === id ? { ...entry, ...update } : entry,
          ),
        apply: replaceById,
      },
    );
  }

  async function deleteEntry(id: string): Promise<void> {
    if (isPlaceholder(id)) {
      return rejectPlaceholder('delete');
    }

    await items.mutate(
      'delete',
      (eventId) => api.deleteProgramItem(eventId, id),
      { apply: (list) => removeById(list, id) },
    );
  }

  return {
    data: items.data,
    isLoading: items.isLoading,
    error: items.error,
    reset: items.reset,
    fetchData,
    createEntry,
    updateEntry,
    deleteEntry,
  };
});
