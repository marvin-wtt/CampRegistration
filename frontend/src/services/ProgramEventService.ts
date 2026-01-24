import type {
  ProgramEvent,
  ProgramEventCreateData,
  ProgramEventUpdateData,
} from '@camp-registration/common/entities';
import { api } from 'boot/axios';

export function useProgramEventService() {
  async function fetchProgramEvents(campId: string): Promise<ProgramEvent[]> {
    const response = await api.get(`camps/${campId}/program-events/`);

    return response?.data?.data;
  }

  async function fetchProgramEvent(
    campId: string,
    programEventId: string,
  ): Promise<ProgramEvent[]> {
    const response = await api.get(
      `camps/${campId}/program-events/${programEventId}/`,
    );

    return response?.data?.data;
  }

  async function createProgramEvent(
    campId: string,
    data: ProgramEventCreateData,
  ): Promise<ProgramEvent> {
    const response = await api.post(`camps/${campId}/program-events/`, data);

    return response?.data?.data;
  }

  async function updateProgramEvent(
    campId: string,
    programEventId: string,
    data: ProgramEventUpdateData,
  ): Promise<ProgramEvent> {
    const response = await api.put(
      `camps/${campId}/program-events/${programEventId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteProgramEvent(
    campId: string,
    programEventId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/program-events/${programEventId}/`);
  }

  return {
    fetchProgramEvents,
    fetchProgramEvent,
    createProgramEvent,
    updateProgramEvent,
    deleteProgramEvent,
  };
}
