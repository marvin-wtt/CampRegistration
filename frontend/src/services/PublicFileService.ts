import { publicFiles } from 'boot/axios';

export function usePublicFileService() {
  async function fetchPublicFile(filename: string): Promise<ArrayBuffer> {
    const response = await publicFiles.get(`public/${filename}`, {
      responseType: 'arraybuffer',
    });

    return response.data;
  }

  return {
    fetchPublicFile,
  };
}
