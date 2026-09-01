import { api } from '@/services/api';
import type {
  Chore,
  ChoreCreateData,
  ChoreUpdateData,
  ChoreAssignment,
  ChoreAssignmentCreateData,
  ChoreAssignmentUpdateData,
  ChoreAssignmentSuggestions,
  ChoreRotationUnit,
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
    choreId: string,
    unit: ChoreRotationUnit,
  ): Promise<ChoreAssignmentSuggestions> {
    const response = await api.get(
      `events/${eventId}/chore-assignments/suggestions/`,
      { params: { choreId, unit } },
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
    createChoreAssignment,
    updateChoreAssignment,
    deleteChoreAssignment,
  };
}
