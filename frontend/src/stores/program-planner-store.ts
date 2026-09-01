import { defineStore } from 'pinia';
import type {
  ProgramItem,
  ProgramItemCreateData,
  ProgramItemUpdateData,
} from '@camp-registration/common/entities';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useEventBus } from '@/composables/bus';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { createUuid } from '@/utils/uuid';

export const useProgramPlannerStore = defineStore('program-planner', () => {
  const route = useRoute();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withErrorNotification,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
  } = useServiceHandler<ProgramItem[]>('programPlanner');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients.
  useRealtimeCollection<ProgramItem>('program_item', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
    fetchOne: (eventId, id) => apiService.fetchProgramItem(eventId, id),
  });

  // Replace the event with this id, or append it if not present.
  function upsertEntry(event: ProgramItem) {
    const list = data.value ?? [];
    data.value = list.some((e) => e.id === event.id)
      ? list.map((e) => (e.id === event.id ? event : e))
      : [...list, event];
  }

  async function fetchData(
    eventId?: string,
    opts?: { background?: boolean },
  ): Promise<void> {
    const cid = checkNotNullWithError(
      eventId ?? (route.params.eventId as string),
    );
    const fetcher = () => apiService.fetchProgramItems(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function createEntry(event: ProgramItemCreateData) {
    const eventId = route.params.eventId as string;
    checkNotNullWithError(eventId);

    const tmpId = `#${createUuid()}`;

    // Optimistic update: add event immediately so it appears in the calendar
    const tmpEvent: ProgramItem = {
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
      apiService.createProgramItem(eventId, event),
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

  async function updateEntry(id: string, event: ProgramItemUpdateData) {
    const eventId = route.params.eventId as string;
    checkNotNullWithError(eventId);

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
      apiService.updateProgramItem(eventId, id, event),
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
    const eventId = route.params.eventId as string;
    checkNotNullWithError(eventId);

    if (isIdOptimistic(id)) {
      return withErrorNotification('delete', () => {
        throw new Error('Please wait until the event is created');
      });
    }

    let deleted = false;
    await withErrorNotification('delete', async () => {
      await apiService.deleteProgramItem(eventId, id);
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
