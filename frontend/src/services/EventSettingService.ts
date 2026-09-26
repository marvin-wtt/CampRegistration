import type { EventSetting } from '@camp-registration/common/entities';
import axios from 'axios';
import { api } from '@/services/api';

export function useEventSettingService() {
  async function fetchEventSetting<T = unknown>(
    eventId: string,
    key: string,
  ): Promise<EventSetting<T> | undefined> {
    try {
      const response = await api.get(`events/${eventId}/settings/${key}/`);

      return response?.data?.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return undefined;
      }

      throw error;
    }
  }

  async function updateEventSetting<T = unknown>(
    eventId: string,
    key: string,
    data: T,
  ): Promise<EventSetting<T>> {
    const response = await api.put(`events/${eventId}/settings/${key}/`, {
      data,
    });

    return response?.data?.data;
  }

  return {
    fetchEventSetting,
    updateEventSetting,
  };
}
