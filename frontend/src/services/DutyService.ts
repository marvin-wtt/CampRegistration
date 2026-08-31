import { api } from '@/services/api';
import type {
  Duty,
  DutyCreateData,
  DutyUpdateData,
  DutyAssignment,
  DutyAssignmentCreateData,
  DutyAssignmentUpdateData,
  DutyAssignmentSuggestions,
} from '@camp-registration/common/entities';

export function useDutyService() {
  async function fetchDuties(eventId: string): Promise<Duty[]> {
    const response = await api.get(`events/${eventId}/duties/`);

    return response?.data?.data;
  }

  async function createDuty(
    eventId: string,
    data: DutyCreateData,
  ): Promise<Duty> {
    const response = await api.post(`events/${eventId}/duties/`, data);

    return response?.data?.data;
  }

  async function updateDuty(
    eventId: string,
    dutyId: string,
    data: DutyUpdateData,
  ): Promise<Duty> {
    const response = await api.patch(
      `events/${eventId}/duties/${dutyId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteDuty(eventId: string, dutyId: string): Promise<void> {
    await api.delete(`events/${eventId}/duties/${dutyId}/`);
  }

  async function fetchDutyAssignments(
    eventId: string,
  ): Promise<DutyAssignment[]> {
    const response = await api.get(`events/${eventId}/duty-assignments/`);

    return response?.data?.data;
  }

  async function fetchDutyAssignment(
    eventId: string,
    dutyAssignmentId: string,
  ): Promise<DutyAssignment> {
    const response = await api.get(
      `events/${eventId}/duty-assignments/${dutyAssignmentId}/`,
    );

    return response?.data?.data;
  }

  async function fetchDutyAssignmentSuggestions(
    eventId: string,
    dutyId: string,
  ): Promise<DutyAssignmentSuggestions> {
    const response = await api.get(
      `events/${eventId}/duty-assignments/suggestions/`,
      { params: { dutyId } },
    );

    return response?.data?.data;
  }

  async function createDutyAssignment(
    eventId: string,
    data: DutyAssignmentCreateData,
  ): Promise<DutyAssignment> {
    const response = await api.post(
      `events/${eventId}/duty-assignments/`,
      data,
    );

    return response?.data?.data;
  }

  async function updateDutyAssignment(
    eventId: string,
    dutyAssignmentId: string,
    data: DutyAssignmentUpdateData,
  ): Promise<DutyAssignment> {
    const response = await api.patch(
      `events/${eventId}/duty-assignments/${dutyAssignmentId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteDutyAssignment(
    eventId: string,
    dutyAssignmentId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/duty-assignments/${dutyAssignmentId}/`);
  }

  return {
    fetchDuties,
    createDuty,
    updateDuty,
    deleteDuty,
    fetchDutyAssignments,
    fetchDutyAssignment,
    fetchDutyAssignmentSuggestions,
    createDutyAssignment,
    updateDutyAssignment,
    deleteDutyAssignment,
  };
}
