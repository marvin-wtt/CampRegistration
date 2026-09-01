import { api } from '@/services/api';
import type {
  ServiceFileCreateData,
  ServiceFileUpdateData,
  ServiceFile,
} from '@camp-registration/common/entities';

export function useFileService() {
  async function fetchEventFiles(eventId: string): Promise<ServiceFile[]> {
    const response = await api.get(`events/${eventId}/files/`);

    return response?.data?.data;
  }

  async function createEventFile(
    eventId: string,
    data: ServiceFileCreateData,
  ): Promise<ServiceFile> {
    const response = await api.post(`events/${eventId}/files/`, data, {
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

  async function updateFile(
    fileId: string,
    data: ServiceFileUpdateData,
  ): Promise<ServiceFile> {
    const response = await api.patch(`files/${fileId}/`, data);

    return response?.data?.data;
  }

  async function deleteFile(fileId: string): Promise<void> {
    await api.delete(`files/${fileId}`);
  }

  async function downloadFile(id: string): Promise<Blob> {
    const url = getFileUrl(id);

    const response = await api.get(url, {
      responseType: 'blob',
    });

    return response.data;
  }

  function getFileUrl(fileId: string): string {
    return api.getUri({
      url: `files/${fileId}/`,
    });
  }

  function getEventFileSlotUrl(
    eventId: string,
    slot: string,
    locale: string,
  ): string {
    return api.getUri({
      url: `events/${eventId}/files/slots/${slot}/`,
      params: { locale },
    });
  }

  return {
    fetchEventFiles,
    createEventFile,
    createTemporaryFile,
    updateFile,
    deleteFile,
    downloadFile,
    getFileUrl,
    getEventFileSlotUrl,
  };
}
