import { api } from '@/services/api';
import type {
  Chore,
  ChoreCreateData,
  ChoreUpdateData,
  ChoreAssignment,
  ChoreAssignmentBulkDeleteQuery,
  ChoreAssignmentCreateData,
  ChoreAssignmentMemberData,
  ChoreAssignmentSuggestionQuery,
  ChoreAssignmentUpdateData,
  ChoreAssignmentSuggestions,
  ChoreFairnessEntry,
  ChoreMemberPreviewData,
  ChoreRemovePersonData,
  ChoreRemovePersonResult,
  ChoreSeriesPlanData,
  ChoreSeriesPlanResult,
} from '@camp-registration/common/entities';

export function useChoreService() {
  async function fetchChores(eventId: string): Promise<Chore[]> {
    const response = await api.get(`events/${eventId}/chores/`);

    return response?.data?.data;
  }

  async function createChore(
    eventId: string,
    data: ChoreCreateData,
  ): Promise<Chore> {
    const response = await api.post(`events/${eventId}/chores/`, data);

    return response?.data?.data;
  }

  async function updateChore(
    eventId: string,
    choreId: string,
    data: ChoreUpdateData,
  ): Promise<Chore> {
    const response = await api.patch(
      `events/${eventId}/chores/${choreId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteChore(eventId: string, choreId: string): Promise<void> {
    await api.delete(`events/${eventId}/chores/${choreId}/`);
  }

  async function fetchChoreAssignments(
    eventId: string,
  ): Promise<ChoreAssignment[]> {
    const response = await api.get(`events/${eventId}/chore-assignments/`);

    return response?.data?.data;
  }

  async function fetchChoreAssignment(
    eventId: string,
    choreAssignmentId: string,
  ): Promise<ChoreAssignment> {
    const response = await api.get(
      `events/${eventId}/chore-assignments/${choreAssignmentId}/`,
    );

    return response?.data?.data;
  }

  async function fetchChoreAssignmentSuggestions(
    eventId: string,
    query: ChoreAssignmentSuggestionQuery,
  ): Promise<ChoreAssignmentSuggestions> {
    const response = await api.get(
      `events/${eventId}/chore-assignments/suggestions/`,
      { params: query },
    );

    return response?.data?.data;
  }

  async function fetchChoreFairness(
    eventId: string,
  ): Promise<ChoreFairnessEntry[]> {
    const response = await api.get(
      `events/${eventId}/chore-assignments/fairness/`,
    );

    return response?.data?.data;
  }

  async function previewChoreMembers(
    eventId: string,
    data: ChoreMemberPreviewData,
  ): Promise<ChoreAssignmentMemberData[]> {
    const response = await api.post(
      `events/${eventId}/chore-assignments/preview/`,
      data,
    );

    return response?.data?.data;
  }

  async function planChoreSeries(
    eventId: string,
    data: ChoreSeriesPlanData,
  ): Promise<ChoreSeriesPlanResult> {
    const response = await api.post(
      `events/${eventId}/chore-assignments/series/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteChoreAssignments(
    eventId: string,
    query: ChoreAssignmentBulkDeleteQuery,
  ): Promise<number> {
    const response = await api.delete(`events/${eventId}/chore-assignments/`, {
      params: query,
    });

    return response?.data?.data?.count;
  }

  async function removePersonFromChores(
    eventId: string,
    data: ChoreRemovePersonData,
  ): Promise<ChoreRemovePersonResult> {
    const response = await api.post(
      `events/${eventId}/chore-assignments/remove-person/`,
      data,
    );

    return response?.data?.data;
  }

  async function fillChoreAssignment(
    eventId: string,
    choreAssignmentId: string,
  ): Promise<ChoreAssignment> {
    const response = await api.post(
      `events/${eventId}/chore-assignments/${choreAssignmentId}/fill/`,
    );

    return response?.data?.data;
  }

  async function createChoreAssignment(
    eventId: string,
    data: ChoreAssignmentCreateData,
  ): Promise<ChoreAssignment> {
    const response = await api.post(
      `events/${eventId}/chore-assignments/`,
      data,
    );

    return response?.data?.data;
  }

  async function updateChoreAssignment(
    eventId: string,
    choreAssignmentId: string,
    data: ChoreAssignmentUpdateData,
  ): Promise<ChoreAssignment> {
    const response = await api.patch(
      `events/${eventId}/chore-assignments/${choreAssignmentId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteChoreAssignment(
    eventId: string,
    choreAssignmentId: string,
  ): Promise<void> {
    await api.delete(
      `events/${eventId}/chore-assignments/${choreAssignmentId}/`,
    );
  }

  return {
    fetchChores,
    createChore,
    updateChore,
    deleteChore,
    fetchChoreAssignments,
    fetchChoreAssignment,
    fetchChoreAssignmentSuggestions,
    fetchChoreFairness,
    previewChoreMembers,
    planChoreSeries,
    deleteChoreAssignments,
    removePersonFromChores,
    fillChoreAssignment,
    createChoreAssignment,
    updateChoreAssignment,
    deleteChoreAssignment,
  };
}
