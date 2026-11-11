import { defineStore } from 'pinia';
import type { Event } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useCollection } from '@/composables/resource';
import { useEventBus } from '@/composables/bus';
import { replaceById } from '@/utils/collection';

/** The events the signed-in user manages. */
export const useAssignedEventsStore = defineStore('assignedEvents', () => {
  const api = useAPIService();
  const bus = useEventBus();
  const events = useCollection<Event>({
    name: 'event',
    fetch: () => api.fetchEvents({ view: 'assigned' }),
  });

  bus.on('create', () => void events.reload());
  bus.on('update', (event) => {
    events.update((list) => replaceById(list, event));
  });
  bus.on('delete', () => void events.reload());

  function fetchData() {
    return events.load();
  }

  return {
    data: events.data,
    isLoading: events.isLoading,
    error: events.error,
    reload: events.reload,
    fetchData,
  };
});
