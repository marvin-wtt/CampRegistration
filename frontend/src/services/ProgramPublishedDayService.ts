import type { ProgramPublishedDay } from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useProgramPublishedDayService() {
  async function fetchProgramPublishedDays(
    eventId: string,
  ): Promise<ProgramPublishedDay[]> {
    const response = await api.get(`events/${eventId}/program-public/days/`);

    return response?.data?.data;
  }

  async function publishProgramDay(
    eventId: string,
    date: string,
    plan: 'a' | 'b' | 'both',
  ): Promise<ProgramPublishedDay> {
    const response = await api.put(
      `events/${eventId}/program-public/days/${date}/`,
      { plan },
    );

    return response?.data?.data;
  }

  async function unpublishProgramDay(
    eventId: string,
    date: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/program-public/days/${date}/`);
  }

  async function publishAllProgramDays(
    eventId: string,
    plan: 'a' | 'b' | 'both',
  ): Promise<ProgramPublishedDay[]> {
    const response = await api.patch(`events/${eventId}/program-public/days/`, {
      plan,
    });

    return response?.data?.data;
  }

  return {
    fetchProgramPublishedDays,
    publishProgramDay,
    unpublishProgramDay,
    publishAllProgramDays,
  };
}
