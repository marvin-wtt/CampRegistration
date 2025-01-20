import { api } from 'boot/axios';
import type {
  CampManager,
  CampManagerCreateData,
  CampManagerUpdateData,
} from '@camp-registration/common/entities';

export function useCampManagerService() {
  async function fetchCampManagers(campId: string): Promise<CampManager[]> {
    const response = await api.get(`camps/${campId}/managers/`);

    return response?.data?.data;
  }

  async function createCampManager(
    campId: string,
    data: CampManagerCreateData,
  ): Promise<CampManager> {
    const response = await api.post(`camps/${campId}/managers/`, data);

    return response?.data?.data;
  }

  async function updateCampManager(
    campId: string,
    id: string,
    data: CampManagerUpdateData,
  ): Promise<CampManager> {
    const response = await api.patch(`camps/${campId}/managers/${id}/`, data);

    return response?.data?.data;
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
