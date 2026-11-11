import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, reactive } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises } from '@vue/test-utils';
import { EventBus } from 'quasar';
import type * as QuasarModule from 'quasar';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import type { Room } from '@camp-registration/common/entities';
import { useRoomStore } from '@/stores/room-store';

const mocks = vi.hoisted(() => ({
  api: {
    fetchRooms: vi.fn(),
    fetchRoom: vi.fn(),
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    bulkUpdateRooms: vi.fn(),
    deleteRoom: vi.fn(),
    createBed: vi.fn(),
    updateBed: vi.fn(),
    deleteBed: vi.fn(),
  },
  notify: vi.fn(),
  realtime: undefined as ((event: RealtimeEvent) => void) | undefined,
  eventBus: undefined as EventBus | undefined,
  route: { params: { eventId: 'event-1' } },
}));

vi.mock('@/services/APIService', () => ({
  useAPIService: () => mocks.api,
  isAPIServiceError: () => false,
}));
vi.mock('quasar', async (importOriginal) => ({
  ...(await importOriginal<typeof QuasarModule>()),
  useQuasar: () => ({ notify: mocks.notify }),
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
}));
vi.mock('@/composables/bus', () => ({
  useAuthBus: () => new EventBus(),
  useEventBus: () => mocks.eventBus,
}));
vi.mock('@/stores/realtime-store', () => ({
  useRealtimeStore: () => ({
    on: (_resource: string, handler: (event: RealtimeEvent) => void) => {
      mocks.realtime = handler;
      return () => {};
    },
    onReconnect: () => () => {},
  }),
}));

function room(id: string, beds: [string, string | null][]): Room {
  return {
    id,
    name: id,
    sortOrder: 0,
    beds: beds.map(([bedId, registrationId]) => ({
      id: bedId,
      registrationId,
    })),
  };
}

async function loadedStore(rooms: Room[]) {
  mocks.api.fetchRooms.mockResolvedValueOnce(rooms);
  const store = useRoomStore();
  await store.fetchData();
  return store;
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(mocks.api).forEach((fn) => fn.mockReset());
  mocks.notify.mockReset().mockReturnValue(vi.fn());
  mocks.eventBus = new EventBus();
  mocks.route = reactive({ params: { eventId: 'event-1' } });
});

describe('room store', () => {
  it('reuses loaded rooms until the event changes', async () => {
    const store = await loadedStore([room('a', [])]);

    await store.fetchData();
    expect(mocks.api.fetchRooms).toHaveBeenCalledOnce();

    mocks.api.fetchRooms.mockResolvedValueOnce([room('b', [])]);
    mocks.route.params.eventId = 'event-2';
    await store.fetchData();

    expect(mocks.api.fetchRooms).toHaveBeenCalledTimes(2);
    expect(mocks.api.fetchRooms).toHaveBeenLastCalledWith('event-2');
    expect(store.data?.map((r) => r.id)).toEqual(['b']);
  });

  it('assigns a bed without mutating the previous room objects', async () => {
    const store = await loadedStore([
      room('a', [
        ['bed-1', null],
        ['bed-2', null],
      ]),
      room('b', [['bed-3', null]]),
    ]);
    const before = store.data!;
    const occupied = computed(
      () =>
        store.data?.flatMap((r) => r.beds).filter((b) => b.registrationId)
          .length,
    );
    expect(occupied.value).toBe(0);

    mocks.api.updateBed.mockResolvedValueOnce(undefined);
    await store.updateBed('a', 'bed-2', 'reg-1');

    expect(mocks.api.updateBed).toHaveBeenCalledWith(
      'event-1',
      'a',
      'bed-2',
      'reg-1',
    );
    expect(store.data![0]!.beds[1]!.registrationId).toBe('reg-1');
    expect(occupied.value).toBe(1);
    // Untouched rooms keep their identity; the changed one is a new object.
    expect(store.data![1]).toBe(before[1]);
    expect(before[0]!.beds[1]!.registrationId).toBeNull();
  });

  it('reloads after a failed bed change and reports it', async () => {
    const store = await loadedStore([room('a', [['bed-1', null]])]);
    mocks.api.updateBed.mockRejectedValueOnce(new Error('offline'));
    mocks.api.fetchRooms.mockResolvedValueOnce([
      room('a', [['bed-1', 'reg-9']]),
    ]);

    await expect(store.updateBed('a', 'bed-1', 'reg-1')).rejects.toThrow(
      'offline',
    );
    await flushPromises();

    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'stores.room.updateBed.error' }),
    );
    expect(store.data![0]!.beds[0]!.registrationId).toBe('reg-9');
    expect(store.requestPending).toBe(false);
  });

  it('shrinks a room by its last empty beds, never an occupied one', async () => {
    const store = await loadedStore([
      room('a', [
        ['bed-1', null],
        ['bed-2', 'reg-1'],
        ['bed-3', null],
      ]),
    ]);
    mocks.api.updateRoom.mockResolvedValueOnce(room('a', []));
    mocks.api.fetchRoom.mockResolvedValueOnce(
      room('a', [
        ['bed-1', null],
        ['bed-2', 'reg-1'],
      ]),
    );

    await store.updateData('a', { name: 'A' }, 2);

    expect(mocks.api.createBed).not.toHaveBeenCalled();
    expect(mocks.api.deleteBed).toHaveBeenCalledOnce();
    expect(mocks.api.deleteBed).toHaveBeenCalledWith('event-1', 'a', 'bed-3');
    expect(store.data![0]!.beds.map((b) => b.id)).toEqual(['bed-1', 'bed-2']);
  });

  it('reloads what was saved when a capacity change fails midway', async () => {
    const store = await loadedStore([room('a', [['bed-1', null]])]);
    mocks.api.updateRoom.mockResolvedValueOnce(room('a', []));
    mocks.api.createBed
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('offline'));
    mocks.api.fetchRooms.mockResolvedValueOnce([
      room('a', [
        ['bed-1', null],
        ['bed-2', null],
      ]),
    ]);

    await expect(store.updateData('a', {}, 3)).rejects.toThrow('offline');
    await flushPromises();

    expect(store.data![0]!.beds).toHaveLength(2);
  });

  it('applies live updates while no page shows the rooms', async () => {
    const store = await loadedStore([room('a', [['bed-1', null]])]);
    mocks.api.fetchRoom.mockResolvedValueOnce(room('a', [['bed-1', 'reg-2']]));

    mocks.realtime!({
      resource: 'room',
      id: 'a',
      operation: 'updated',
    } as RealtimeEvent);
    await flushPromises();

    expect(store.data![0]!.beds[0]!.registrationId).toBe('reg-2');
  });

  it('creates, reorders and deletes rooms', async () => {
    const store = await loadedStore([room('a', [])]);

    mocks.api.createRoom.mockResolvedValueOnce(room('b', []));
    await store.createData({ name: 'b', capacity: 0 });
    expect(store.data?.map((r) => r.id)).toEqual(['a', 'b']);

    mocks.api.bulkUpdateRooms.mockResolvedValueOnce([
      { ...room('b', []), sortOrder: 5 },
    ]);
    await store.reorder([{ id: 'b', sortOrder: 5 }]);
    expect(store.data![1]!.sortOrder).toBe(5);

    mocks.api.deleteRoom.mockResolvedValueOnce(undefined);
    await store.deleteData('a');
    expect(store.data?.map((r) => r.id)).toEqual(['b']);
  });
});
