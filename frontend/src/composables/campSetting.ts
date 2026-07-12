import { reactive, ref, watch, type Ref } from 'vue';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { useRealtimeStore } from '@/stores/realtime-store';
import { useAPIService } from '@/services/APIService';

/**
 * Reactive settings object backed by the shared, camp-scoped settings API
 * (`GET/PUT /camps/:campId/settings/:key`), so all managers of a camp see the
 * same values. Replaces the old `useCampStorage` localStorage composable.
 *
 * Mirrors `camp-details-store.ts`'s single-object realtime pattern: on a
 * `setting` event for this key, refetch through the API (single auth path)
 * rather than trusting pushed data.
 */
export function useCampSettings<T extends object>(
  key: string,
  defaults: T,
): { settings: T; isLoading: Ref<boolean> } {
  const campDetailsStore = useCampDetailsStore();
  const realtime = useRealtimeStore();
  const api = useAPIService();

  const settings = reactive<T>({ ...defaults }) as T;
  const isLoading = ref(false);
  // Guards the save watcher below from re-saving a value we just applied
  // ourselves from a fetch/remote change (would otherwise loop).
  let applyingRemote = false;

  async function load() {
    const campId = campDetailsStore.data?.id;
    if (!campId) {
      return;
    }

    isLoading.value = true;
    try {
      const fetched = await api.fetchCampSetting<T>(campId, key);

      applyingRemote = true;
      Object.assign(settings, defaults, fetched?.data ?? {});
      applyingRemote = false;
    } finally {
      isLoading.value = false;
    }
  }

  watch(() => campDetailsStore.data?.id, load, { immediate: true });

  watch(
    settings,
    () => {
      if (applyingRemote) {
        return;
      }

      const campId = campDetailsStore.data?.id;
      if (!campId) {
        return;
      }

      void api.updateCampSetting<T>(campId, key, { ...settings });
    },
    { deep: true },
  );

  realtime.on('setting', (event) => {
    if (event.id !== key) {
      return;
    }

    void load();
  });

  return { settings, isLoading };
}
