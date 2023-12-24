import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Roommate, RoomWithRoommates } from 'src/types/Room';
import { useServiceHandler } from 'src/composables/serviceHandler';
import {
  useAuthBus,
  useCampBus,
  useRegistrationBus,
} from 'src/composables/bus';
import { useRegistrationsStore } from 'stores/registration-store';
import type {
  Registration,
  Room,
  RoomCreateData,
  RoomUpdateData,
} from '@camp-registration/common/entities';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { formatPersonName } from 'src/utils/formatters';

export const useRoomPlannerStore = defineStore('room-planner', () => {
  const apiService = useAPIService();
  const route = useRoute();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withProgressNotification,
    withErrorNotification,
    lazyFetch,
    asyncUpdate,
    requestPending,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<RoomWithRoommates[]>('roomPlanner');
  const registrationsStore = useRegistrationsStore();
  const campBus = useCampBus();
  const authBus = useAuthBus();
  const registrationBus = useRegistrationBus();
  const registrationHelper = useRegistrationHelper();

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  registrationBus.on('update', async () => {
    invalidate();
  });

  async function fetchRooms(campId?: string) {
    campId = campId ?? (route.params.camp as string | undefined);

    const cid = checkNotNullWithError(campId);
    await lazyFetch(async () => {
      const data = await apiService.fetchRooms(cid);

      return data.map((room) => mapResponseRoom(room));
    });
  }

  async function createRoom(
    createData: RoomCreateData,
  ): Promise<Room | undefined> {
    const campId = route.params.camp as string | undefined;

    const cid = checkNotNullWithError(campId);
    return withProgressNotification('create', async () => {
      const room = await apiService.createRoom(cid, createData);

      data.value?.push(mapResponseRoom(room));

      return room;
    });
  }

  async function updateRoom(
    roomId: string | undefined,
    updateData: RoomUpdateData,
  ): Promise<Room | undefined> {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const rid = checkNotNullWithNotification(roomId);
    return withProgressNotification('update', async () => {
      const room = await apiService.updateRoom(cid, rid, updateData);

      invalidate();
      await fetchRooms();

      return room;
    });
  }

  async function deleteRoom(roomId: string | undefined) {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const rid = checkNotNullWithNotification(roomId);
    await withProgressNotification('delete', async () => {
      await apiService.deleteRoom(cid, rid);

      // Remove the room from the list
      const index = data.value?.findIndex((value) => value.id === rid);
      if (index !== undefined && index != -1) {
        data.value?.splice(index, 1);
      }
      // TODO Inform bus - registration store needs to listen
    });
  }

  async function updateBed(
    room: RoomWithRoommates,
    position: number,
    person: Roommate | null,
  ) {
    const campId = route.params.camp as string;
    const roomId = room.id;
    const bedId = room.beds[position].id;
    const registrationId = person?.id ?? null;

    asyncUpdate(() => {
      return withErrorNotification('update-bed', () => {
        return apiService.updateBed(campId, roomId, bedId, registrationId);
      });
    });

    // Optimistic update
    room.beds[position].person = person;
  }

  function mapResponseRoom(room: Room): RoomWithRoommates {
    return {
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      beds: room.beds.map((bed) => {
        return {
          id: bed.id,
          person: findRegistrationById(bed.registrationId),
        };
      }),
    };
  }

  function findRegistrationById(registrationId: string | null) {
    if (!registrationId) {
      return null;
    }

    const registrations = registrationsStore.data;
    if (!registrations) {
      return null;
    }

    const registration = registrations.find(
      (value) => value.id === registrationId,
    );
    if (!registration) {
      return null;
    }

    return mapRegistrationRoommate(registration);
  }

  function mapRegistrationRoommate(registration: Registration): Roommate {
    const name = formatPersonName(registrationHelper.uniqueName(registration));
    const age = registrationHelper.age(registration);
    const gender = registrationHelper.gender(registration);
    const country = registrationHelper.country(registration);
    const counselor = registrationHelper.counselor(registration);

    return {
      id: registration.id,
      name,
      age,
      gender,
      country,
      counselor,
    };
  }

  const availableRoommates = computed<Roommate[]>(() => {
    const localRooms = data.value;
    let results: Registration[] | undefined = registrationsStore.data;

    if (localRooms === undefined || results === undefined) {
      return [];
    }

    // Filter out people who are already in a group
    results = results.filter((person) => {
      return !localRooms.some((room) => {
        return room.beds.some((value) => value?.person?.id === person.id);
      });
    });

    // Map to roommate type and sort by age
    return results
      .map((roommate) => {
        return mapRegistrationRoommate(roommate);
      })
      .sort((a, b) => {
        return (a.age ?? 999) - (b.age ?? 999);
      });
  });

  const storeLoading = computed<boolean>(() => {
    return isLoading.value || registrationsStore.isLoading;
  });

  const storeError = computed<string | object | null>(() => {
    return error.value ?? registrationsStore.error;
  });

  return {
    data,
    availableRoommates,
    isLoading: storeLoading,
    error: storeError,
    requestPending,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    updateBed,
    reset,
  };
});
