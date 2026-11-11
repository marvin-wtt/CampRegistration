import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import {
  removeById,
  replaceAllById,
  replaceById,
  upsertById,
} from '@/utils/collection';
import type {
  Room,
  RoomCreateData,
  RoomUpdateData,
} from '@camp-registration/common/entities';

export interface RoomOrderData {
  id: string;
  sortOrder?: number;
}

function withBed(
  rooms: Room[],
  roomId: string,
  bedId: string,
  registrationId: string | null,
): Room[] {
  return rooms.map((room) =>
    room.id !== roomId
      ? room
      : {
          ...room,
          beds: room.beds.map((bed) =>
            bed.id === bedId ? { ...bed, registrationId } : bed,
          ),
        },
  );
}

// Room changes come from dialogs that close first, so they show a progress
// toast; assigning a bed shows in place and only reports failures.
export const useRoomStore = defineStore('room', () => {
  const api = useAPIService();
  const rooms = useCollection<Room>({
    name: 'room',
    key: useRouteKey('eventId'),
    fetch: (eventId) => api.fetchRooms(eventId),
    // Bed changes arrive as 'room updated' events for the parent room; bulk
    // reorders as one collection-level invalidation.
    realtime: {
      resource: 'room',
      fetchOne: (eventId, id) => api.fetchRoom(eventId, id),
    },
  });

  function fetchData(eventId?: string) {
    return rooms.load(eventId);
  }

  function createData(createData: RoomCreateData): Promise<Room> {
    return rooms.mutate(
      'create',
      (eventId) => api.createRoom(eventId, createData),
      { feedback: 'progress', apply: upsertById },
    );
  }

  // Several requests: if one fails midway, the reload shows what was saved.
  // Shrinking removes empty beds only, starting from the last one.
  function updateData(
    roomId: string,
    updateData: RoomUpdateData,
    capacity?: number,
  ): Promise<Room> {
    const beds = rooms.data.value?.find((room) => room.id === roomId)?.beds;
    const diff = capacity === undefined || !beds ? 0 : capacity - beds.length;
    const add = Math.max(diff, 0);
    const removeBedIds =
      diff < 0
        ? (beds ?? [])
            .filter((bed) => bed.registrationId === null)
            .slice(diff)
            .map((bed) => bed.id)
        : [];

    return rooms.mutate(
      'update',
      async (eventId) => {
        const room = await api.updateRoom(eventId, roomId, updateData);
        for (let i = 0; i < add; i++) {
          await api.createBed(eventId, roomId);
        }
        for (const bedId of removeBedIds) {
          await api.deleteBed(eventId, roomId, bedId);
        }
        return add > 0 || removeBedIds.length > 0
          ? api.fetchRoom(eventId, roomId)
          : room;
      },
      { feedback: 'progress', apply: replaceById },
    );
  }

  function reorder(order: RoomOrderData[]): Promise<Room[]> {
    return rooms.mutate(
      'update',
      (eventId) => api.bulkUpdateRooms(eventId, order),
      { feedback: 'progress', apply: replaceAllById },
    );
  }

  async function deleteData(roomId: string): Promise<void> {
    await rooms.mutate('delete', (eventId) => api.deleteRoom(eventId, roomId), {
      feedback: 'progress',
      apply: (list) => removeById(list, roomId),
    });
  }

  async function updateBed(
    roomId: string,
    bedId: string,
    registrationId: string | null,
  ): Promise<void> {
    await rooms.mutate(
      'updateBed',
      (eventId) => api.updateBed(eventId, roomId, bedId, registrationId),
      { apply: (list) => withBed(list, roomId, bedId, registrationId) },
    );
  }

  return {
    data: rooms.data,
    isLoading: rooms.isLoading,
    error: rooms.error,
    requestPending: rooms.pending,
    reset: rooms.reset,
    fetchData,
    createData,
    updateData,
    reorder,
    deleteData,
    updateBed,
  };
});
