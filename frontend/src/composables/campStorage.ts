import { reactive, watch } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';

/**
 * Reactive settings object that is persisted to `localStorage`, scoped to the
 * camp currently held by the camp-details store. The storage key is derived
 * from `keyPrefix` and the camp id, so each camp keeps its own preferences.
 *
 * The id is resolved reactively: until the camp is loaded the values fall back
 * to `defaults` and nothing is persisted, and once the camp becomes available
 * (or changes) the stored values for that camp are loaded.
 */
export function useCampStorage<T extends object>(
  keyPrefix: string,
  defaults: T,
): T {
  const campDetailsStore = useCampDetailsStore();

  function storageKey(): string | undefined {
    const id = campDetailsStore.data?.id;
    return id ? `${keyPrefix}:${id}` : undefined;
  }

  function load(): T {
    const key = storageKey();
    if (key) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          return {
            ...defaults,
            ...(JSON.parse(stored) as Partial<T>),
          };
        }
      } catch {
        // Ignore invalid stored settings and fall back to defaults
      }
    }

    return { ...defaults };
  }

  const settings = reactive<T>(load()) as T;

  // Reload the stored values whenever the active camp changes.
  watch(
    () => campDetailsStore.data?.id,
    () => {
      Object.assign(settings, load());
    },
  );

  watch(
    settings,
    () => {
      const key = storageKey();
      if (key) {
        localStorage.setItem(key, JSON.stringify({ ...settings }));
      }
    },
    { deep: true },
  );

  return settings;
}
