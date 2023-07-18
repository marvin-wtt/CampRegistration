import { api } from 'boot/axios';
import { ResponseRoom, Room } from 'src/types/Room';

export function useRoomService() {
  async function fetchRooms(campId: string): Promise<ResponseRoom[]> {
    const response = await api.get(`camps/${campId}/rooms/`);

    return response.data.data;
  }

  async function fetchRoom(campId: string, id: string): Promise<ResponseRoom> {
    const response = await api.get(`camps/${campId}/rooms/${id}/`);

    return response.data.data;
  }

  async function createRoom(
    campId: string,
    data: Pick<Room, 'name' | 'capacity'>
  ): Promise<ResponseRoom> {
    const response = await api.post(`camps/${campId}/rooms/`, {
      name: data.name,
      capacity: data.capacity,
    });

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

  async function updateBed(
    campId: string,
    roomId: string,
    bedId: string,
    registrationId: string | null
  ) {
    await api.put(`camps/${campId}/rooms/${roomId}/beds/${bedId}/`, {
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
