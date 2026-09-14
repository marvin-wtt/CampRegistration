import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type {
  ChoreAssignment,
  ChoreAssignmentCreateData,
  ChoreAssignmentUpdateData,
  ChoreAssignmentSuggestions,
  ChoreRotationUnit,
} from '@camp-registration/common/entities';

export const useChoreAssignmentStore = defineStore('choreAssignment', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withProgressNotification,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<ChoreAssignment[]>('choreAssignment');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients.
  useRealtimeCollection<ChoreAssignment>('choreAssignment', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
    fetchOne: (eventId, id) => api.fetchChoreAssignment(eventId, id),
  });

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    eventId ??= route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    const fetcher = () => api.fetchChoreAssignments(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function fetchSuggestions(
    choreId: string,
    unit: ChoreRotationUnit,
  ): Promise<ChoreAssignmentSuggestions | undefined> {
    const eventId = route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    return api.fetchChoreAssignmentSuggestions(cid, choreId, unit);
  }

  // The page groups assignments by date assuming the list is sorted
  // ascending (matching the backend's `orderBy: [{ date }, { createdAt }]`),
  // so a locally-added/updated assignment must be placed by date rather than
  // appended or left at its old index — otherwise same-date groups split.
  function insertSorted(assignment: ChoreAssignment) {
    const list = (data.value ?? []).filter(
      (value) => value.id !== assignment.id,
    );
    const index = list.findIndex((value) => value.date > assignment.date);

    if (index === -1) {
      list.push(assignment);
    } else {
      list.splice(index, 0, assignment);
    }

    data.value = list;
  }

  async function createData(newData: ChoreAssignmentCreateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);

    return withProgressNotification('create', async () => {
      const assignment = await api.createChoreAssignment(eventId, newData);

      insertSorted(assignment);

      return assignment;
    });
  }

  async function updateData(
    choreAssignmentId: string,
    updateData: ChoreAssignmentUpdateData,
  ) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(choreAssignmentId);

    await withProgressNotification('update', async () => {
      const assignment = await api.updateChoreAssignment(
        eventId,
        choreAssignmentId,
        updateData,
      );

      insertSorted(assignment);
    });
  }

  async function deleteData(choreAssignmentId: string) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(choreAssignmentId);

    await withProgressNotification('delete', async () => {
      await api.deleteChoreAssignment(eventId, choreAssignmentId);

      data.value = data.value?.filter(
        (assignment) => assignment.id !== choreAssignmentId,
      );
    });
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    fetchSuggestions,
    createData,
    updateData,
    deleteData,
  };
});
