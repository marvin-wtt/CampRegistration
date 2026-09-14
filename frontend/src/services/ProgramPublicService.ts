import type { ProgramPublicView } from '@camp-registration/common/entities';
import { api } from '@/services/api';
import { extendAxiosConfig } from '@/services/AuthService';

export function useProgramPublicService() {
  async function fetchProgramPublicView(
    eventId: string,
    config?: {
      date?: string | undefined;
      skipAuthenticationHandler?: boolean;
    },
  ): Promise<ProgramPublicView> {
    const response = await api.get(
      `events/${eventId}/program-public/`,
      extendAxiosConfig({
        params: config?.date ? { date: config.date } : undefined,
        _skipAuthenticationHandler: config?.skipAuthenticationHandler,
      }),
    );

    return response?.data?.data;
  }

  return {
    fetchProgramPublicView,
  };
}
