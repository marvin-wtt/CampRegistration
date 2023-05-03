import { api } from 'boot/axios';
import { Room } from 'src/types/Room';

export function useRoomService() {
  async function fetchRooms(campId: string): Promise<Room[]> {
    const response = await api.get(`camps/${campId}/rooms/`);

    return response.data.data;
  }

  async function fetchRoom(campId: string, id: string): Promise<Room> {
    const response = await api.get(`camps/${campId}/rooms/${id}/`);

    return response.data.data;
  }

  async function createRoom(campId: string, data: Room): Promise<Room> {
    const response = await api.post(`camps/${campId}/rooms/`, data);

    return response.data.data;
  }

  async function updateRoom(
    campId: string,
    id: string,
    data: Partial<Room>
  ): Promise<Room> {
    const response = await api.patch(`camps/${campId}/rooms/${id}/`, data);

    return response.data.data;
  }

  async function deleteRoom(campId: string, id: string): Promise<void> {
    await api.delete(`camps/${campId}/rooms/${id}/`);
  }

  return {
    fetchRooms,
    fetchRoom,
    createRoom,
    updateRoom,
    deleteRoom,
  };
}
