import type {
  ProgramItem,
  ProgramItemCreateData,
  ProgramItemUpdateData,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useProgramItemService() {
  async function fetchProgramItems(eventId: string): Promise<ProgramItem[]> {
    const response = await api.get(`events/${eventId}/program-events/`);

    return response?.data?.data;
  }

  async function fetchProgramItem(
    eventId: string,
    programItemId: string,
  ): Promise<ProgramItem> {
    const response = await api.get(
      `events/${eventId}/program-events/${programItemId}/`,
    );

    return response?.data?.data;
  }

  async function createProgramItem(
    eventId: string,
    data: ProgramItemCreateData,
  ): Promise<ProgramItem> {
    const response = await api.post(`events/${eventId}/program-events/`, data);

    return response?.data?.data;
  }

  async function updateProgramItem(
    eventId: string,
    programItemId: string,
    data: ProgramItemUpdateData,
  ): Promise<ProgramItem> {
    const response = await api.patch(
      `events/${eventId}/program-events/${programItemId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteProgramItem(
    eventId: string,
    programItemId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/program-events/${programItemId}/`);
  }

  return {
    fetchProgramItems,
    fetchProgramItem,
    createProgramItem,
    updateProgramItem,
    deleteProgramItem,
  };
}
