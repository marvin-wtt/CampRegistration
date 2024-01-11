import { api } from 'boot/axios';
import type {
  ServiceFileCreateData,
  ServiceFile,
} from '@camp-registration/common/entities';

export function useFileService() {
  async function fetchCampFiles(campId: string): Promise<ServiceFile[]> {
    const response = await api.get(`camps/${campId}/files/`);

    return response.data?.data;
  }

  async function createCampFile(
    campId: string,
    data: ServiceFileCreateData,
  ): Promise<ServiceFile> {
    const response = await api.post(`camps/${campId}/files/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data?.data;
  }

  async function deleteCampFile(campId: string, id: string): Promise<void> {
    await api.delete(`camps/${campId}/files/${id}`);
  }

  async function downloadCampFile(campId: string, id: string) {
    // TODO How to start a browser download in the same tab?
  }

  function getCampFileUrl(campId: string, id: string): string {
    return `${api.defaults.baseURL}camps/${campId}/files/${id}/`;
  }

  return {
    fetchCampFiles,
    createCampFile,
    deleteCampFile,
    downloadCampFile,
    getCampFileUrl,
  };
}
