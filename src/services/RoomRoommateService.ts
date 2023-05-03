import { api } from 'boot/axios';

export function useRoomRoommateService() {
  async function createRoomRoommate(
    campId: string,
    roomId: string,
    roommateId: string
  ): Promise<void> {
    await api.post(`camps/${campId}/rooms/${roomId}`, {
      roommateId: roommateId,
    });
  }

  async function deleteRoomRoommate(
    campId: string,
    roomId: string,
    roommateId: string
  ): Promise<void> {
    await api.delete(`camps/${campId}/rooms/${roomId}/${roommateId}`);
  }

  return {
    createRoomRoommate,
    deleteRoomRoommate,
  };
}
