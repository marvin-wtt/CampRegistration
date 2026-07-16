import type { CampSetting } from '@camp-registration/common/entities';
import axios from 'axios';
import { api } from '@/services/api';

export function useCampSettingService() {
  async function fetchCampSetting<T = unknown>(
    campId: string,
    key: string,
  ): Promise<CampSetting<T> | undefined> {
    try {
      const response = await api.get(`camps/${campId}/settings/${key}/`);

      return response?.data?.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return undefined;
      }

      throw error;
    }
  }

  async function updateCampSetting<T = unknown>(
    campId: string,
    key: string,
    data: T,
  ): Promise<CampSetting<T>> {
    const response = await api.put(`camps/${campId}/settings/${key}/`, {
      data,
    });

    return response?.data?.data;
  }

  return {
    fetchCampSetting,
    updateCampSetting,
  };
}
