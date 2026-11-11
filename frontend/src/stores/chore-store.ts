import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import type {
  Chore,
  ChoreCreateData,
  ChoreUpdateData,
} from '@camp-registration/common/entities';

// Results show in place, so writes only report failures.
export const useChoreStore = defineStore('chore', () => {
  const api = useAPIService();
  const chores = useCollection<Chore>({
    name: 'chore',
    key: useRouteKey('eventId'),
    fetch: (eventId) => api.fetchChores(eventId),
    realtime: { resource: 'chore' },
  });

  function fetchData(eventId?: string) {
    return chores.load(eventId);
  }

  function createData(createData: ChoreCreateData): Promise<Chore> {
    return chores.mutate(
      'create',
      (eventId) => api.createChore(eventId, createData),
      { apply: upsertById },
    );
  }

  async function updateData(
    choreId: string,
    updateData: ChoreUpdateData,
  ): Promise<void> {
    await chores.mutate(
      'update',
      (eventId) => api.updateChore(eventId, choreId, updateData),
      { apply: replaceById },
    );
  }

  async function deleteData(choreId: string): Promise<void> {
    await chores.mutate(
      'delete',
      (eventId) => api.deleteChore(eventId, choreId),
      { apply: (list) => removeById(list, choreId) },
    );
  }

  return {
    data: chores.data,
    isLoading: chores.isLoading,
    error: chores.error,
    reset: chores.reset,
    fetchData,
    createData,
    updateData,
    deleteData,
  };
});
