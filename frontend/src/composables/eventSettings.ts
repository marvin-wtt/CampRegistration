import { nextTick, reactive, ref, watch, type Ref } from 'vue';
import type { SettingKey } from '@camp-registration/common/settings';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useRealtimeStore } from '@/stores/realtime-store';
import { useAPIService } from '@/services/APIService';
import {
  useErrorExtractor,
  useServiceNotifications,
} from '@/composables/serviceHandler';

/**
 * Reactive settings object backed by the shared, event-scoped settings API
 * (`GET/PUT /events/:eventId/settings/:key`), so all managers of a event see the
 * same values. Replaces the old `useEventStorage` localStorage composable.
 *
 * Mirrors `event-details-store.ts`'s single-object realtime pattern: on a
 * `setting` event for this key, refetch through the API (single auth path)
 * rather than trusting pushed data.
 *
 * A failed load sets `error`; a failed save notifies and reloads, so the UI
 * never keeps showing a value the server rejected.
 */
export function useEventSettings<T extends object>(
  key: SettingKey,
  defaults: T,
): { settings: T; isLoading: Ref<boolean>; error: Ref<string | null> } {
  const eventDetailsStore = useEventDetailsStore();
  const realtime = useRealtimeStore();
  const api = useAPIService();
  const { extractErrorText } = useErrorExtractor();
  const { withErrorNotification } = useServiceNotifications('setting');

  const settings = reactive<T>({ ...defaults });
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  // Guards the save watcher below from re-saving a value we just applied
  // ourselves from a fetch/remote change (would otherwise loop).
  let applyingRemote = false;

  async function load() {
    const eventId = eventDetailsStore.data?.id;
    if (!eventId) {
      return;
    }

    isLoading.value = true;
    try {
      const fetched = await api.fetchEventSetting<T>(eventId, key);

      // Stale guard: the event changed while the fetch was in flight — applying
      // would show (and, via the save watcher, write) this event's values under
      // the new event.
      if (eventDetailsStore.data?.id !== eventId) {
        return;
      }

      applyingRemote = true;
      Object.assign(settings, defaults, fetched?.data ?? {});
      // The save watcher flushes on the next tick, so the guard must outlive
      // this synchronous block or the fetched values get re-saved (and would
      // ping-pong between clients via realtime events).
      void nextTick(() => {
        applyingRemote = false;
      });
      error.value = null;
    } catch (err: unknown) {
      if (eventDetailsStore.data?.id === eventId) {
        error.value = extractErrorText(err);
      }
    } finally {
      isLoading.value = false;
    }
  }

  watch(() => eventDetailsStore.data?.id, load, { immediate: true });

  watch(
    settings,
    () => {
      if (applyingRemote) {
        return;
      }

      const eventId = eventDetailsStore.data?.id;
      if (!eventId) {
        return;
      }

      void save(eventId);
    },
    { deep: true },
  );

  async function save(eventId: string) {
    const saved = await withErrorNotification('update', async () => {
      await api.updateEventSetting<T>(eventId, key, { ...settings } as T);
      return true;
    });

    if (!saved) {
      await load();
    }
  }

  realtime.on('setting', (event) => {
    if (event.id !== key) {
      return;
    }

    void load();
  });

  return { settings: settings as T, isLoading, error };
}
