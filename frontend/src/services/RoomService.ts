import { api } from '@/services/api';
import type {
  Bed,
  Room,
  RoomCreateData,
  RoomUpdateData,
} from '@camp-registration/common/entities';

export function useRoomService() {
  async function fetchRooms(eventId: string): Promise<Room[]> {
    const response = await api.get(`events/${eventId}/rooms/`);

    return response?.data?.data;
  }

  async function fetchRoom(eventId: string, id: string): Promise<Room> {
    const response = await api.get(`events/${eventId}/rooms/${id}/`);

    return response?.data?.data;
  }

  async function bulkUpdateRooms(
    eventId: string,
    rooms: {
      id: string;
      name?: string | Record<string, string>;
      sortOrder?: number;
    }[],
  ): Promise<Room[]> {
    const response = await api.patch(`events/${eventId}/rooms/`, {
      rooms,
    });

    return response?.data?.data;
  }

  async function createRoom(
    eventId: string,
    data: RoomCreateData,
  ): Promise<Room> {
    const response = await api.post(`events/${eventId}/rooms/`, {
      name: data.name,
      capacity: data.capacity,
    });

    return response?.data?.data;
  }

  async function updateRoom(
    eventId: string,
    id: string,
    data: RoomUpdateData,
  ): Promise<Room> {
    const response = await api.patch(`events/${eventId}/rooms/${id}/`, data);

    return response?.data?.data;
  }

  async function deleteRoom(eventId: string, id: string): Promise<void> {
    await api.delete(`events/${eventId}/rooms/${id}/`);
  }

  async function createBed(eventId: string, roomId: string): Promise<Bed> {
    const response = await api.post(`events/${eventId}/rooms/${roomId}/beds/`);

    return response?.data?.data;
  }

  async function updateBed(
    eventId: string,
    roomId: string,
    bedId: string,
    registrationId: string | null,
  ) {
    await api.patch(`events/${eventId}/rooms/${roomId}/beds/${bedId}/`, {
      registrationId,
    });
  }

  async function deleteBed(
    eventId: string,
    roomId: string,
    bedId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/rooms/${roomId}/beds/${bedId}/`);
  }

  return {
    fetchRooms,
    bulkUpdateRooms,
    fetchRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    createBed,
    updateBed,
    deleteBed,
  };
}
