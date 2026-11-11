import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
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

  // Bed assignments in flight; leaving the page would lose them.
  const bedUpdates = ref<number>(0);

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

  // Capacity changes are applied atomically by the backend, which refuses to
  // remove occupied beds.
  function updateData(
    roomId: string,
    updateData: RoomUpdateData,
  ): Promise<Room> {
    return rooms.mutate(
      'update',
      (eventId) => api.updateRoom(eventId, roomId, updateData),
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
    bedUpdates.value++;
    try {
      await rooms.mutate(
        'updateBed',
        (eventId) => api.updateBed(eventId, roomId, bedId, registrationId),
        { apply: (list) => withBed(list, roomId, bedId, registrationId) },
      );
    } finally {
      bedUpdates.value--;
    }
  }

  return {
    data: rooms.data,
    isLoading: rooms.isLoading,
    error: rooms.error,
    requestPending: computed(() => bedUpdates.value > 0),
    reset: rooms.reset,
    fetchData,
    createData,
    updateData,
    reorder,
    deleteData,
    updateBed,
  };
});
