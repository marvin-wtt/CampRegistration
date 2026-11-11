import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type {
  ChoreAssignment,
  ChoreAssignmentBulkDeleteQuery,
  ChoreAssignmentCreateData,
  ChoreAssignmentMemberData,
  ChoreAssignmentStatus,
  ChoreAssignmentSuggestionQuery,
  ChoreAssignmentSuggestions,
  ChoreAssignmentUpdateData,
  ChoreAutoFillData,
  ChoreFairnessEntry,
  ChoreMemberRemovalQuery,
  ChoreSeriesPlanData,
  ChoreRebalanceChange,
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
    mutate,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<ChoreAssignment[]>('choreAssignment', {
    reload: () => fetchData(undefined, { background: true }),
  });

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

  function currentEventId(): string {
    return checkNotNullWithError(route.params.eventId as string | undefined);
  }

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    eventId ??= route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    const fetcher = () => api.fetchChoreAssignments(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  // Bulk operations change many rows at once; reload quietly afterwards.
  async function reload() {
    await fetchData(undefined, { background: true });
  }

  function replaceLocal(assignment: ChoreAssignment) {
    data.value = data.value?.map((value) =>
      value.id === assignment.id ? assignment : value,
    );
  }

  async function fetchSuggestions(
    query: ChoreAssignmentSuggestionQuery,
  ): Promise<ChoreAssignmentSuggestions | undefined> {
    return api.fetchChoreAssignmentSuggestions(currentEventId(), query);
  }

  async function fetchFairness(): Promise<ChoreFairnessEntry[]> {
    return api.fetchChoreFairness(currentEventId());
  }

  async function autoFillMembers(
    data: ChoreAutoFillData,
  ): Promise<ChoreAssignmentMemberData[]> {
    return api.autoFillChoreMembers(currentEventId(), data);
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

  // Single changes show in place, so only failures are notified; bulk ones
  // keep a progress toast. A failure reloads the list and rejects with an
  // already reported error, so callers' follow-ups are skipped.
  async function createData(
    newData: ChoreAssignmentCreateData,
  ): Promise<ChoreAssignment> {
    const eventId = currentEventId();

    const assignment = await mutate('create', () =>
      api.createChoreAssignment(eventId, newData),
    );

    insertSorted(assignment);
    return assignment;
  }

  async function updateData(
    choreAssignmentId: string,
    updateData: ChoreAssignmentUpdateData,
  ): Promise<void> {
    const eventId = currentEventId();
    checkNotNullWithNotification(choreAssignmentId);

    insertSorted(
      await mutate('update', () =>
        api.updateChoreAssignment(eventId, choreAssignmentId, updateData),
      ),
    );
  }

  // e.g. "mark all of today done" — one notification for the whole batch.
  async function setStatusMany(
    choreAssignmentIds: string[],
    status: ChoreAssignmentStatus,
  ): Promise<void> {
    const eventId = currentEventId();

    await mutate(
      'update',
      async () => {
        const results = await Promise.allSettled(
          choreAssignmentIds.map((id) =>
            api.updateChoreAssignment(eventId, id, { status }),
          ),
        );
        // A partial failure still throws, so mutate reloads the rest.
        const failed = results.filter((result) => {
          if (result.status === 'fulfilled') {
            replaceLocal(result.value);
          }
          return result.status === 'rejected';
        });
        if (failed[0]) {
          throw failed[0].reason;
        }
      },
      { progress: true },
    );
  }

  async function fillData(choreAssignmentId: string): Promise<void> {
    const eventId = currentEventId();

    replaceLocal(
      await mutate('fill', () =>
        api.fillChoreAssignment(eventId, choreAssignmentId),
      ),
    );
  }

  async function deleteData(choreAssignmentId: string): Promise<void> {
    const eventId = currentEventId();
    checkNotNullWithNotification(choreAssignmentId);

    await mutate('delete', () =>
      api.deleteChoreAssignment(eventId, choreAssignmentId),
    );

    data.value = data.value?.filter(
      (assignment) => assignment.id !== choreAssignmentId,
    );
  }

  async function planSeries(plan: ChoreSeriesPlanData) {
    const eventId = currentEventId();

    const result = await mutate(
      'series',
      () => api.planChoreSeries(eventId, plan),
      { progress: true },
    );

    await reload();
    return result;
  }

  async function deleteMany(query: ChoreAssignmentBulkDeleteQuery) {
    const eventId = currentEventId();

    const result = await mutate(
      'deleteMany',
      () => api.deleteChoreAssignments(eventId, query),
      { progress: true },
    );

    await reload();
    return result;
  }

  async function removeMember(
    registrationId: string,
    query: ChoreMemberRemovalQuery,
  ) {
    const eventId = currentEventId();

    const result = await mutate(
      'removePerson',
      () => api.removeChoreMember(eventId, registrationId, query),
      { progress: true },
    );

    await reload();
    return result;
  }

  async function fetchRebalance(): Promise<ChoreRebalanceChange[]> {
    return api.fetchChoreRebalance(currentEventId());
  }

  async function applyRebalance(
    changes: ChoreRebalanceChange[],
  ): Promise<void> {
    const eventId = currentEventId();

    await mutate(
      'rebalance',
      () => api.applyChoreRebalance(eventId, { changes }),
      { progress: true },
    );

    await reload();
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    fetchSuggestions,
    fetchFairness,
    autoFillMembers,
    createData,
    updateData,
    setStatusMany,
    fillData,
    deleteData,
    planSeries,
    deleteMany,
    removeMember,
    fetchRebalance,
    applyRebalance,
  };
});
