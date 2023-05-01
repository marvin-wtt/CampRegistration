import { api } from 'boot/axios';

export function useCampManagerService() {
  async function createCampManager(
    campId: string,
    userId: string
  ): Promise<void> {
    await api.post(`camps/${campId}/managers/`, {
      userId: userId,
    });
  }

  async function deleteCampManager(
    campId: string,
    userId: string
  ): Promise<void> {
    await api.delete(`camps/${campId}/managers/${userId}/`);
  }

  return {
    createCampManager,
    deleteCampManager,
  };
}
