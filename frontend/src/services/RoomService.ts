import { api } from 'boot/axios';
import type {
  Room,
  RoomCreateData,
  RoomUpdateData,
} from '@camp-registration/common/entities';

export function useRoomService() {
  async function fetchRooms(campId: string): Promise<Room[]> {
    const response = await api.get(`camps/${campId}/rooms/`);

    return response?.data?.data;
  }

  async function fetchRoom(campId: string, id: string): Promise<Room> {
    const response = await api.get(`camps/${campId}/rooms/${id}/`);

    return response?.data?.data;
  }

  async function createRoom(
    campId: string,
    data: RoomCreateData,
  ): Promise<Room> {
    const response = await api.post(`camps/${campId}/rooms/`, {
      name: data.name,
      capacity: data.capacity,
    });

    return response?.data?.data;
  }

  async function updateRoom(
    campId: string,
    id: string,
    data: RoomUpdateData,
  ): Promise<Room> {
    const response = await api.patch(`camps/${campId}/rooms/${id}/`, data);

    return response?.data?.data;
  }

  async function deleteRoom(campId: string, id: string): Promise<void> {
    await api.delete(`camps/${campId}/rooms/${id}/`);
  }

  async function updateBed(
    campId: string,
    roomId: string,
    bedId: string,
    registrationId: string | null,
  ) {
    await api.patch(`camps/${campId}/rooms/${roomId}/beds/${bedId}/`, {
      registrationId,
    });
  }

  return {
    fetchRooms,
    fetchRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    updateBed,
  };
}
