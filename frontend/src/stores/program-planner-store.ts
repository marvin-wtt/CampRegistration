import { defineStore } from 'pinia';
import type {
  ProgramEvent,
  ProgramEventCreateData,
  ProgramEventUpdateData,
} from '@camp-registration/common/entities';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { useRealtimeStore } from 'stores/realtime-store';

export const useProgramPlannerStore = defineStore('program-planner', () => {
  const route = useRoute();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const campBus = useCampBus();
  const realtime = useRealtimeStore();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withErrorNotification,
    lazyFetch,
    checkNotNullWithError,
  } = useServiceHandler<ProgramEvent[]>('programPlanner');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients (and to the server's echo
  // of this client's own writes — upserts by id make that idempotent).
  realtime.on('program_event', (event) => void handleRemoteChange(event));
  realtime.onReconnect('program_event', () => void reload());

  // Replace the event with this id, or append it if not present.
  function upsertEntry(event: ProgramEvent) {
    const list = data.value ?? [];
    data.value = list.some((e) => e.id === event.id)
      ? list.map((e) => (e.id === event.id ? event : e))
      : [...list, event];
  }

  async function handleRemoteChange(event: RealtimeEvent) {
    const campId = route.params.campId as string | undefined;
    if (!campId) {
      return;
    }

    // Not loaded on the current page — mark stale and let the page refetch.
    if (data.value === undefined) {
      invalidate();
      return;
    }

    if (event.operation === 'deleted') {
      data.value = data.value.filter((e) => e.id !== event.id);
      return;
    }

    const programEvent = await apiService.fetchProgramEvent(campId, event.id);
    upsertEntry(programEvent);
  }

  async function reload(): Promise<void> {
    invalidate();
    await fetchData();
  }

  async function fetchData(campId?: string): Promise<void> {
    const cid = checkNotNullWithError(
      campId ?? (route.params.campId as string),
    );
    await lazyFetch(async () => await apiService.fetchProgramEvents(cid));
  }

  async function createEntry(event: ProgramEventCreateData) {
    const campId = route.params.campId as string;
    checkNotNullWithError(campId);

    const tmpId = `#${crypto.randomUUID()}`;

    // Optimistic update: add event immediately so it appears in the calendar
    const tmpEvent: ProgramEvent = {
      id: tmpId,
      title: event.title,
      details: event.details ?? null,
      location: event.location ?? null,
      date: event.date ?? null,
      time: event.time ?? null,
      duration: event.duration ?? null,
      color: event.color ?? null,
      plan: event.plan ?? 'both',
    };
    data.value = [...(data.value ?? []), tmpEvent];

    const result = await withErrorNotification('create', () =>
      apiService.createProgramEvent(campId, event),
    );

    if (result) {
      // Drop the optimistic placeholder and upsert the server response. Using
      // an id-keyed upsert (rather than a plain replace) dedupes the case where
      // the realtime "created" echo already inserted the server event.
      data.value = (data.value ?? []).filter((value) => value.id !== tmpId);
      upsertEntry(result);
    } else {
      // Error occurred - remove optimistic event
      data.value = data.value?.filter((value) => value.id !== tmpId);
    }

    return result;
  }

  function isIdOptimistic(id: string): boolean {
    return id.startsWith('#');
  }

  async function updateEntry(id: string, event: ProgramEventUpdateData) {
    const campId = route.params.campId as string;
    checkNotNullWithError(campId);

    if (isIdOptimistic(id)) {
      return withErrorNotification('update', () => {
        throw new Error('Please wait until the event is created');
      });
    }

    // Optimistic update: update UI immediately for responsive drag-and-drop
    const previousData = data.value ? [...data.value] : undefined;
    const currentEvent = data.value?.find((e) => e.id === id);
    if (currentEvent) {
      const optimisticEvent = { ...currentEvent, ...event };
      data.value = data.value?.map((value) =>
        value.id === id ? optimisticEvent : value,
      );
    }

    const result = await withErrorNotification('update', () =>
      apiService.updateProgramEvent(campId, id, event),
    );

    if (result) {
      // Reconcile with server response
      data.value = data.value?.map((value) =>
        value.id === id ? result : value,
      );
    } else {
      // Error occurred - revert to previous state
      data.value = previousData;
    }
  }

  async function deleteEntry(id: string) {
    const campId = route.params.campId as string;
    checkNotNullWithError(campId);

    if (isIdOptimistic(id)) {
      return withErrorNotification('delete', () => {
        throw new Error('Please wait until the event is created');
      });
    }

    let deleted = false;
    await withErrorNotification('delete', async () => {
      await apiService.deleteProgramEvent(campId, id);
      deleted = true;
    });

    if (deleted) {
      data.value = data.value?.filter((event) => event.id !== id);
    }
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    createEntry,
    updateEntry,
    deleteEntry,
  };
});
