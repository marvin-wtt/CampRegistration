import type {
  Event,
  EventDetails,
  EventCreateData,
  EventUpdateData,
  EventQuery,
  CursorPaginated,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';
import { extendAxiosConfig } from '@/services/AuthService';

export function useEventService() {
  async function fetchEvents(query?: EventQuery): Promise<Event[]> {
    const response = await api.get('events/', {
      params: query,
    });

    return response?.data?.data;
  }

  async function fetchEventsPaginated(
    query?: EventQuery,
  ): Promise<CursorPaginated<Event>> {
    const response = await api.get('events/', {
      params: query,
    });

    return {
      data: response?.data?.data ?? [],
      meta: response?.data?.meta,
    };
  }

  async function fetchEvent(
    id: string,
    config?: { skipAuthenticationHandler: boolean },
  ): Promise<EventDetails> {
    const response = await api.get(
      `events/${id}/`,
      extendAxiosConfig({
        _skipAuthenticationHandler: config?.skipAuthenticationHandler,
      }),
    );

    return response?.data?.data;
  }

  async function createEvent(data: EventCreateData): Promise<EventDetails> {
    const response = await api.post('events/', data);

    return response.data?.data;
  }

  async function updateEvent(
    id: string,
    data: EventUpdateData,
  ): Promise<EventDetails> {
    const response = await api.patch(`events/${id}/`, data);

    return response?.data?.data;
  }

  async function deleteEvent(id: string): Promise<void> {
    await api.delete(`events/${id}/`);
  }

  return {
    fetchEvents,
    fetchEventsPaginated,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
