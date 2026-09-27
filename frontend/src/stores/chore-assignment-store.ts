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

  async function createData(newData: ChoreAssignmentCreateData) {
    const eventId = currentEventId();

    return withProgressNotification('create', async () => {
      const assignment = await api.createChoreAssignment(eventId, newData);

      data.value?.push(assignment);

      return assignment;
    });
  }

  async function updateData(
    choreAssignmentId: string,
    updateData: ChoreAssignmentUpdateData,
  ) {
    const eventId = currentEventId();
    checkNotNullWithNotification(choreAssignmentId);

    await withProgressNotification('update', async () => {
      replaceLocal(
        await api.updateChoreAssignment(eventId, choreAssignmentId, updateData),
      );
    });
  }

  // e.g. "mark all of today done" — one notification for the whole batch.
  async function setStatusMany(
    choreAssignmentIds: string[],
    status: ChoreAssignmentStatus,
  ) {
    const eventId = currentEventId();

    await withProgressNotification('update', async () => {
      const updated = await Promise.all(
        choreAssignmentIds.map((id) =>
          api.updateChoreAssignment(eventId, id, { status }),
        ),
      );
      updated.forEach(replaceLocal);
    });
  }

  async function fillData(choreAssignmentId: string) {
    const eventId = currentEventId();

    await withProgressNotification('fill', async () => {
      replaceLocal(await api.fillChoreAssignment(eventId, choreAssignmentId));
    });
  }

  async function deleteData(choreAssignmentId: string) {
    const eventId = currentEventId();
    checkNotNullWithNotification(choreAssignmentId);

    await withProgressNotification('delete', async () => {
      await api.deleteChoreAssignment(eventId, choreAssignmentId);

      data.value = data.value?.filter(
        (assignment) => assignment.id !== choreAssignmentId,
      );
    });
  }

  async function planSeries(plan: ChoreSeriesPlanData) {
    const eventId = currentEventId();

    const result = await withProgressNotification('series', () =>
      api.planChoreSeries(eventId, plan),
    );
    await reload();

    return result;
  }

  async function deleteMany(query: ChoreAssignmentBulkDeleteQuery) {
    const eventId = currentEventId();

    const count = await withProgressNotification('deleteMany', () =>
      api.deleteChoreAssignments(eventId, query),
    );
    await reload();

    return count;
  }

  async function removeMember(
    registrationId: string,
    query: ChoreMemberRemovalQuery,
  ) {
    const eventId = currentEventId();

    const result = await withProgressNotification('removePerson', () =>
      api.removeChoreMember(eventId, registrationId, query),
    );
    await reload();

    return result;
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
  };
});
