import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type {
  DutyAssignment,
  DutyAssignmentCreateData,
  DutyAssignmentUpdateData,
  DutyAssignmentSuggestions,
} from '@camp-registration/common/entities';

export const useDutyAssignmentStore = defineStore('dutyAssignment', () => {
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
  } = useServiceHandler<DutyAssignment[]>('dutyAssignment');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients.
  useRealtimeCollection<DutyAssignment>('dutyAssignment', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
    fetchOne: (eventId, id) => api.fetchDutyAssignment(eventId, id),
  });

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    eventId ??= route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    const fetcher = () => api.fetchDutyAssignments(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function fetchSuggestions(
    dutyId: string,
  ): Promise<DutyAssignmentSuggestions | undefined> {
    const eventId = route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    return api.fetchDutyAssignmentSuggestions(cid, dutyId);
  }

  async function createData(newData: DutyAssignmentCreateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);

    return withProgressNotification('create', async () => {
      const assignment = await api.createDutyAssignment(eventId, newData);

      data.value?.push(assignment);

      return assignment;
    });
  }

  async function updateData(
    dutyAssignmentId: string,
    updateData: DutyAssignmentUpdateData,
  ) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(dutyAssignmentId);

    await withProgressNotification('update', async () => {
      const assignment = await api.updateDutyAssignment(
        eventId,
        dutyAssignmentId,
        updateData,
      );

      data.value = data.value?.map((value) =>
        value.id === assignment.id ? assignment : value,
      );
    });
  }

  async function deleteData(dutyAssignmentId: string) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(dutyAssignmentId);

    await withProgressNotification('delete', async () => {
      await api.deleteDutyAssignment(eventId, dutyAssignmentId);

      data.value = data.value?.filter(
        (assignment) => assignment.id !== dutyAssignmentId,
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
