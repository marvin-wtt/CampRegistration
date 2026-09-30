import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus } from '@/composables/bus';
import type { PriceModel } from '@camp-registration/common/entities';

/**
 * Every price model, for the administration pages that show which model an
 * organization or event is on. Only system administrators can load it.
 */
export const usePriceModelsStore = defineStore('priceModels', () => {
  const api = useAPIService();
  const authBus = useAuthBus();
  const { data, isLoading, error, reset, invalidate, lazyFetch, forceFetch } =
    useServiceHandler<PriceModel[]>('billing');

  authBus.on('logout', () => {
    reset();
  });

  const byId = computed(
    () => new Map((data.value ?? []).map((model) => [model.id, model])),
  );

  async function fetchData() {
    await lazyFetch(() => api.fetchPriceModels());
  }

  async function reload() {
    await forceFetch(() => api.fetchPriceModels());
  }

  return {
    data,
    byId,
    isLoading,
    error,
    reset,
    invalidate,
    fetchData,
    reload,
  };
});
