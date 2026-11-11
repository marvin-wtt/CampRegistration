import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type {
  Room,
  RoomCreateData,
  RoomUpdateData,
} from '@camp-registration/common/entities';

export interface RoomOrderData {
  id: string;
  sortOrder?: number;
}

export const useRoomStore = defineStore('room', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const {
    data,
    isLoading,
    error,
    requestPending,
    reset,
    invalidate,
    mutate,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
  } = useServiceHandler<Room[]>('room', {
    reload: () => fetchData(undefined, { background: true }),
  });

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // Bed changes arrive as 'room updated' events for the parent room; bulk
  // reorders as one collection-level invalidation.
  useRealtimeCollection<Room>('room', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
    fetchOne: (eventId, id) => api.fetchRoom(eventId, id),
  });

  function currentEventId(): string {
    return checkNotNullWithError(route.params.eventId as string | undefined);
  }

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    eventId ??= route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    const fetcher = () => api.fetchRooms(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  function replaceLocal(room: Room) {
    data.value = data.value?.map((value) =>
      value.id === room.id ? room : value,
    );
  }

  // Room changes come from dialogs that close first, so they keep a progress
  // toast. A failure reloads the list and rejects with an already reported
  // error.
  async function createData(createData: RoomCreateData): Promise<Room> {
    const eventId = currentEventId();

    const room = await mutate(
      'create',
      () => api.createRoom(eventId, createData),
      { progress: true },
    );

    data.value?.push(room);
    return room;
  }

  // Several requests: if one fails midway, mutate reloads what was saved.
  // Shrinking removes empty beds only, starting from the last one.
  async function updateData(
    roomId: string,
    updateData: RoomUpdateData,
    capacity?: number,
  ): Promise<Room> {
    const eventId = currentEventId();
    const beds = data.value?.find((room) => room.id === roomId)?.beds ?? [];
    const diff = capacity === undefined ? 0 : capacity - beds.length;
    const add = Math.max(diff, 0);
    const removeBedIds =
      diff < 0
        ? beds
            .filter((bed) => bed.registrationId === null)
            .slice(diff)
            .map((bed) => bed.id)
        : [];

    const room = await mutate(
      'update',
      async () => {
        let room = await api.updateRoom(eventId, roomId, updateData);

        for (let i = 0; i < add; i++) {
          await api.createBed(eventId, roomId);
        }
        for (const bedId of removeBedIds) {
          await api.deleteBed(eventId, roomId, bedId);
        }

        if (add > 0 || removeBedIds.length > 0) {
          room = await api.fetchRoom(eventId, roomId);
        }

        return room;
      },
      { progress: true },
    );

    replaceLocal(room);
    return room;
  }

  async function reorder(rooms: RoomOrderData[]): Promise<Room[]> {
    const eventId = currentEventId();

    const updatedRooms = await mutate(
      'update',
      () => api.bulkUpdateRooms(eventId, rooms),
      { progress: true },
    );

    data.value = data.value?.map(
      (room) => updatedRooms.find((r) => r.id === room.id) ?? room,
    );
    return updatedRooms;
  }

  async function deleteData(roomId: string): Promise<void> {
    const eventId = currentEventId();

    await mutate('delete', () => api.deleteRoom(eventId, roomId), {
      progress: true,
    });

    data.value = data.value?.filter((room) => room.id !== roomId);
  }

  // Assigning a bed shows in place, so only failures are notified.
  async function updateBed(
    roomId: string,
    bedId: string,
    registrationId: string | null,
  ): Promise<void> {
    const eventId = currentEventId();

    await mutate('updateBed', () =>
      api.updateBed(eventId, roomId, bedId, registrationId),
    );

    data.value = data.value?.map((room) =>
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

  return {
    reset,
    data,
    isLoading,
    error,
    requestPending,
    fetchData,
    createData,
    updateData,
    reorder,
    deleteData,
    updateBed,
  };
});
