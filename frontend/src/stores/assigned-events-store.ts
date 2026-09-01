import { defineStore } from 'pinia';
import type { Event } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useEventBus } from '@/composables/bus';

export const useAssignedEventsStore = defineStore('assignedEvents', () => {
  const apiService = useAPIService();
  const bus = useEventBus();
  const authBus = useAuthBus();
  const { data, isLoading, error, reset, lazyFetch } =
    useServiceHandler<Event[]>('event');

  bus.on('create', () => void reload());
  bus.on('update', (updatedEvent) => {
    if (data.value) {
      const index = data.value.findIndex((c) => c.id === updatedEvent.id);
      if (index !== -1) {
        data.value[index] = updatedEvent;
      }
    }
  });
  bus.on('delete', () => void reload());
  authBus.on('logout', () => reset());

  async function reload() {
    reset();
    return fetchData();
  }

  async function fetchData() {
    return lazyFetch(
      async () => await apiService.fetchEvents({ view: 'assigned' }),
    );
  }

  return {
    data,
    isLoading,
    error,
    fetchData,
    reload,
  };
});
