import { Camp } from 'src/types/Camp';
import { api } from 'boot/axios';

export function useCampService() {
  async function fetchCamps(): Promise<Camp[]> {
    const response = await api.get('camps/');

    return response.data.data;
  }

  async function fetchCamp(id: string): Promise<Camp> {
    const response = await api.get(`camps/${id}/`);

    return response.data.data;
  }

  async function createCamp(data: Camp): Promise<void> {
    await api.post('camps/', data);
  }

  async function updateCamp(id: string, data: Partial<Camp>): Promise<void> {
    await api.patch(`camps/${id}/`, data);
  }

  async function deleteCamp(id: string): Promise<void> {
    await api.delete(`camps/${id}/`);
  }

  return {
    fetchCamps,
    fetchCamp,
    createCamp,
    updateCamp,
    deleteCamp,
  };
}
