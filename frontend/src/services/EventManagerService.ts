import { api } from '@/services/api';
import type {
  EventManager,
  EventManagerCreateData,
  EventManagerUpdateData,
} from '@camp-registration/common/entities';

export function useEventManagerService() {
  async function fetchEventManagers(eventId: string): Promise<EventManager[]> {
    const response = await api.get(`events/${eventId}/managers/`);

    return response?.data?.data;
  }

  async function fetchEventManager(
    eventId: string,
    id: string,
  ): Promise<EventManager> {
    const response = await api.get(`events/${eventId}/managers/${id}/`);

    return response?.data?.data;
  }

  async function createEventManager(
    eventId: string,
    data: EventManagerCreateData,
  ): Promise<EventManager> {
    const response = await api.post(`events/${eventId}/managers/`, data);

    return response?.data?.data;
  }

  async function updateEventManager(
    eventId: string,
    id: string,
    data: EventManagerUpdateData,
  ): Promise<EventManager> {
    const response = await api.patch(`events/${eventId}/managers/${id}/`, data);

    return response?.data?.data;
  }

  async function deleteEventManager(
    eventId: string,
    id: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/managers/${id}/`);
  }

  return {
    fetchEventManagers,
    fetchEventManager,
    createEventManager,
    updateEventManager,
    deleteEventManager,
  };
}
