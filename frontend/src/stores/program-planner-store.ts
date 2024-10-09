import { defineStore } from 'pinia';
import type {
  ProgramEvent,
  ProgramEventCreateData,
  ProgramEventUpdateData,
} from '@camp-registration/common/entities';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';

export const useProgramPlannerStore = defineStore('program-planner', () => {
  const route = useRoute();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const campBus = useCampBus();
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

  // TODO Force fetch on update error after all pending requests finished
  //  --> Set loading to true while waiting

  // TODO Add translations

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  async function fetchData(id?: string): Promise<void> {
    const campId = id ?? (route.params.camp as string | undefined);

    const cid = checkNotNullWithError(campId);
    await lazyFetch(async () => await apiService.fetchProgramEvents(cid));
  }

  async function createEntry(event: ProgramEventCreateData) {
    const campId = route.params.camp as string;
    checkNotNullWithError(campId);

    // When we do optimistic updates, we do not know the id of the event before the requests finishes.
    // Generate a temporary ID and replace it later
    const tmpId = `#${crypto.randomUUID()}`;

    withErrorNotification('create', async () => {
      const result = await apiService.createProgramEvent(campId, event);

      // Add item to data
      data.value = data.value?.map((value) =>
        value.id === tmpId ? result : value,
      );

      return result;
    });

    // Optimistic update
    const tmpEvent = {
      id: tmpId,
      ...event,
    };

    data.value?.push(tmpEvent);
  }

  function isIdOptimistic(id: string): boolean {
    return id.startsWith('#');
  }

  async function updateEntry(id: string, event: ProgramEventUpdateData) {
    const campId = route.params.camp as string;
    checkNotNullWithError(campId);

    if (isIdOptimistic(id)) {
      return withErrorNotification('update', () => {
        throw 'Please wait...';
      });
    }

    withErrorNotification('update', () =>
      apiService.updateProgramEvent(campId, id, event),
    );

    // Optimistic update
    const currentEvent = data.value?.find((event) => event.id === id);
    if (!currentEvent) {
      return;
    }
    const resultEvent: ProgramEvent = {
      ...currentEvent,
      ...event,
    };
    data.value = data.value?.map((value) =>
      value.id === id ? resultEvent : value,
    );
  }

  async function deleteEntry(id: string) {
    const campId = route.params.camp as string;
    checkNotNullWithError(campId);

    if (isIdOptimistic(id)) {
      return withErrorNotification('update', () => {
        throw 'Please wait...';
      });
    }

    withErrorNotification('delete', () =>
      apiService.deleteProgramEvent(campId, id),
    );

    data.value = data.value?.filter((event) => event.id === id);
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
