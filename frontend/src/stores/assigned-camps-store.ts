import { defineStore } from 'pinia';
import type { Camp } from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';

export const useAssignedCampsStore = defineStore('assignedCamps', () => {
  const apiService = useAPIService();
  const bus = useCampBus();
  const authBus = useAuthBus();
  const { data, isLoading, error, reset, lazyFetch } =
    useServiceHandler<Camp[]>('camp');

  bus.on('create', () => void reload());
  bus.on('delete', () => void reload());
  authBus.on('logout', () => reset());

  async function reload() {
    reset();
    return fetchData();
  }

  async function fetchData() {
    return lazyFetch(
      async () => await apiService.fetchCamps({ view: 'assigned' }),
    );
  }

  return {
    data,
    isLoading,
    error,
    fetchData,
  };
});
