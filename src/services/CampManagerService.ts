import { api } from 'boot/axios';
import { CampManager } from 'src/types/CampManager';

export function useCampManagerService() {
  async function fetchCampManagers(campId: string): Promise<CampManager[]> {
    const response = await api.get(`camps/${campId}/managers/`);

    return response.data.data;
  }

  async function createCampManager(
    campId: string,
    email: string
  ): Promise<CampManager> {
    const response = await api.post(`camps/${campId}/managers/`, {
      email,
    });

    return response.data.data;
  }

  async function deleteCampManager(
    campId: string,
    userId: string
  ): Promise<void> {
    await api.delete(`camps/${campId}/managers/${userId}/`);
  }

  return {
    fetchCampManagers,
    createCampManager,
    deleteCampManager,
  };
}
