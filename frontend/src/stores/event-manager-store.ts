import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import type {
  EventManager,
  EventManagerCreateData,
  EventManagerUpdateData,
} from '@camp-registration/common/entities';

export const useEventManagerStore = defineStore('eventManager', () => {
  const api = useAPIService();
  const managers = useCollection<EventManager>({
    name: 'eventManager',
    key: useRouteKey('eventId'),
    fetch: (eventId) => api.fetchEventManagers(eventId),
    realtime: {
      resource: 'manager',
      fetchOne: (eventId, id) => api.fetchEventManager(eventId, id),
    },
  });

  function fetchData(eventId?: string) {
    return managers.load(eventId);
  }

  async function createData(createData: EventManagerCreateData): Promise<void> {
    await managers.mutate(
      'create',
      (eventId) => api.createEventManager(eventId, createData),
      { feedback: 'progress', apply: upsertById },
    );
  }

  async function updateData(
    managerId: string,
    updateData: EventManagerUpdateData,
  ): Promise<void> {
    await managers.mutate(
      'update',
      (eventId) => api.updateEventManager(eventId, managerId, updateData),
      { feedback: 'progress', apply: replaceById },
    );
  }

  async function deleteData(managerId: string): Promise<void> {
    await managers.mutate(
      'delete',
      (eventId) => api.deleteEventManager(eventId, managerId),
      { feedback: 'progress', apply: (list) => removeById(list, managerId) },
    );
  }

  return {
    data: managers.data,
    isLoading: managers.isLoading,
    error: managers.error,
    reset: managers.reset,
    fetchData,
    createData,
    updateData,
    deleteData,
  };
});
