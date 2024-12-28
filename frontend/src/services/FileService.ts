import { api } from 'boot/axios';
import type {
  ServiceFileCreateData,
  ServiceFile,
} from '@camp-registration/common/entities';

export function useFileService() {
  async function fetchCampFiles(campId: string): Promise<ServiceFile[]> {
    const response = await api.get(`camps/${campId}/files/`);

    return response?.data?.data;
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

    return response?.data?.data;
  }

  async function createTemporaryFile(
    data: ServiceFileCreateData,
  ): Promise<ServiceFile> {
    const response = await api.postForm('files/', data);

    return response?.data?.data;
  }

  async function deleteCampFile(campId: string, fileId: string): Promise<void> {
    await api.delete(`camps/${campId}/files/${fileId}`);
  }

  async function downloadCampFile(campId: string, fileId: string) {
    return downloadFile(getCampFileUrl(campId, fileId));
  }

  async function downloadFile(url: string): Promise<Blob> {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    return response.data;
  }

  function getCampFileUrl(campId: string, fileId: string): string {
    return api.getUri({
      url: `camps/${campId}/files/${fileId}/`,
    });
  }

  function getRegistrationFileUrl(
    campId: string,
    registrationId: string,
    fileId: string,
  ) {
    return api.getUri({
      url: `camps/${campId}/registrations/${registrationId}files/${fileId}/`,
    });
  }

  return {
    downloadFile,
    fetchCampFiles,
    createCampFile,
    createTemporaryFile,
    deleteCampFile,
    downloadCampFile,
    getCampFileUrl,
    getRegistrationFileUrl,
  };
}
