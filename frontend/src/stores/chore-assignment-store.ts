import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { requireKey, useCollection, useRouteKey } from '@/composables/resource';
import { removeById, replaceAllById, replaceById } from '@/utils/collection';
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

// The page groups assignments by date assuming the list is sorted ascending
// (as the backend returns it), so a created or updated one is placed by date
// rather than appended or left at its old index.
function placeByDate(
  list: ChoreAssignment[],
  assignment: ChoreAssignment,
): ChoreAssignment[] {
  const rest = removeById(list, assignment.id);
  const index = rest.findIndex((value) => value.date > assignment.date);
  return index === -1
    ? [...rest, assignment]
    : [...rest.slice(0, index), assignment, ...rest.slice(index)];
}

// Single changes show in place and only report failures; bulk ones show a
// progress toast and reload the list afterwards.
export const useChoreAssignmentStore = defineStore('choreAssignment', () => {
  const api = useAPIService();
  const eventKey = useRouteKey('eventId');
  const assignments = useCollection<ChoreAssignment>({
    name: 'choreAssignment',
    key: eventKey,
    fetch: (eventId) => api.fetchChoreAssignments(eventId),
    realtime: {
      resource: 'choreAssignment',
      fetchOne: (eventId, id) => api.fetchChoreAssignment(eventId, id),
    },
  });

  function fetchData(eventId?: string) {
    return assignments.load(eventId);
  }

  function fetchSuggestions(
    query: ChoreAssignmentSuggestionQuery,
  ): Promise<ChoreAssignmentSuggestions | undefined> {
    return api.fetchChoreAssignmentSuggestions(requireKey(eventKey), query);
  }

  function fetchFairness(): Promise<ChoreFairnessEntry[]> {
    return api.fetchChoreFairness(requireKey(eventKey));
  }

  function autoFillMembers(
    data: ChoreAutoFillData,
  ): Promise<ChoreAssignmentMemberData[]> {
    return api.autoFillChoreMembers(requireKey(eventKey), data);
  }

  function fetchRebalance(): Promise<ChoreRebalanceChange[]> {
    return api.fetchChoreRebalance(requireKey(eventKey));
  }

  function createData(
    createData: ChoreAssignmentCreateData,
  ): Promise<ChoreAssignment> {
    return assignments.mutate(
      'create',
      (eventId) => api.createChoreAssignment(eventId, createData),
      { apply: placeByDate },
    );
  }

  async function updateData(
    choreAssignmentId: string,
    updateData: ChoreAssignmentUpdateData,
  ): Promise<void> {
    await assignments.mutate(
      'update',
      (eventId) =>
        api.updateChoreAssignment(eventId, choreAssignmentId, updateData),
      { apply: placeByDate },
    );
  }

  // e.g. "mark all of today done" — one toast for the whole batch.
  async function setStatusMany(
    choreAssignmentIds: string[],
    status: ChoreAssignmentStatus,
  ): Promise<void> {
    await assignments.mutate(
      'update',
      async (eventId) => {
        const results = await Promise.allSettled(
          choreAssignmentIds.map((id) =>
            api.updateChoreAssignment(eventId, id, { status }),
          ),
        );
        // A partial failure rejects, so the reload shows what was saved.
        const failed = results.find((result) => result.status === 'rejected');
        if (failed) {
          throw failed.reason;
        }
        return results.map(
          (result) => (result as PromiseFulfilledResult<ChoreAssignment>).value,
        );
      },
      { feedback: 'progress', apply: replaceAllById },
    );
  }

  async function fillData(choreAssignmentId: string): Promise<void> {
    await assignments.mutate(
      'fill',
      (eventId) => api.fillChoreAssignment(eventId, choreAssignmentId),
      { apply: replaceById },
    );
  }

  async function deleteData(choreAssignmentId: string): Promise<void> {
    await assignments.mutate(
      'delete',
      (eventId) => api.deleteChoreAssignment(eventId, choreAssignmentId),
      { apply: (list) => removeById(list, choreAssignmentId) },
    );
  }

  // Bulk changes touch many rows at once; the list is reloaded afterwards.
  async function bulk<R>(
    operation: string,
    request: (eventId: string) => Promise<R>,
  ): Promise<R> {
    const result = await assignments.mutate(operation, request, {
      feedback: 'progress',
    });
    await assignments.reload();
    return result;
  }

  function planSeries(plan: ChoreSeriesPlanData) {
    return bulk('series', (eventId) => api.planChoreSeries(eventId, plan));
  }

  function deleteMany(query: ChoreAssignmentBulkDeleteQuery) {
    return bulk('deleteMany', (eventId) =>
      api.deleteChoreAssignments(eventId, query),
    );
  }

  function removeMember(
    registrationId: string,
    query: ChoreMemberRemovalQuery,
  ) {
    return bulk('removePerson', (eventId) =>
      api.removeChoreMember(eventId, registrationId, query),
    );
  }

  async function applyRebalance(
    changes: ChoreRebalanceChange[],
  ): Promise<void> {
    await bulk('rebalance', (eventId) =>
      api.applyChoreRebalance(eventId, { changes }),
    );
  }

  return {
    data: assignments.data,
    isLoading: assignments.isLoading,
    error: assignments.error,
    reset: assignments.reset,
    reload: assignments.reload,
    fetchData,
    fetchSuggestions,
    fetchFairness,
    autoFillMembers,
    fetchRebalance,
    createData,
    updateData,
    setStatusMany,
    fillData,
    deleteData,
    planSeries,
    deleteMany,
    removeMember,
    applyRebalance,
  };
});
