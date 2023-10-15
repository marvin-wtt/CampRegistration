import { api } from 'boot/axios';
import { CampManager, CampManagerUpdateData } from 'src/types/CampManager';
import { Camp } from 'src/types/Camp';

export function useCampManagerService() {
  async function fetchCampManagers(campId: string): Promise<CampManager[]> {
    const response = await api.get(`camps/${campId}/managers/`);

    return response.data.data;
  }

  async function createCampManager(
    campId: string,
    email: string,
  ): Promise<CampManager> {
    const response = await api.post(`camps/${campId}/managers/`, {
      email,
    });

    return response.data.data;
  }

  async function updateCampManager(
    campId: string,
    id: string,
    data: CampManagerUpdateData,
  ): Promise<Camp> {
    const response = await api.patch(`camps/${campId}/managers/${id}/`, data);

    return response.data.data;
  }

  async function deleteCampManager(campId: string, id: string): Promise<void> {
    await api.delete(`camps/${campId}/managers/${id}/`);
  }

  return {
    fetchCampManagers,
    createCampManager,
    updateCampManager,
    deleteCampManager,
  };
}
