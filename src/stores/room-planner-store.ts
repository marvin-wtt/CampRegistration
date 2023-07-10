import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Room } from 'src/types/Room';
import { useServiceHandler } from 'src/composables/serviceHandler';
import {
  useAuthBus,
  useCampBus,
  useRegistrationBus,
} from 'src/composables/bus';
import { useRegistrationsStore } from 'stores/registration-store';
import { Registration } from 'src/types/Registration';
import { Roommate } from 'src/types/Roommate';
import { RegistrationSettings } from 'src/types/RegistrationSettings';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { formatPersonName, formatUniqueName } from 'src/utils/formatters';

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
    lazyFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<Room[]>('room-planner');
  const campDetailsStore = useCampDetailsStore();
  const registrationsStore = useRegistrationsStore();
  const campBus = useCampBus();
  const authBus = useAuthBus();
  const registrationBus = useRegistrationBus();

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  registrationBus.on('update', () => {
    // TODO Remap with registration data instead
    data.value = mapRoomsRoommates(data.value ?? []);
  });

  const settings = ref<RegistrationSettings>({
    firstNameKey: 'first_name',
    lastNameKey: 'last_name',
    dateOfBirthKey: 'date_of_birth',
    genderKey: 'gender',
    countryKey: 'country',
  });

  const availableRoommates = computed<Roommate[]>(() => {
    const localRooms = data.value;
    let results: Registration[] | undefined = registrationsStore.data;

    if (localRooms === undefined || results === undefined) {
      return [];
    }

    // Filter out people who are already in a group
    results = results.filter((person) => {
      return !localRooms.some((room) => {
        return room.roommates.some((value) => value?.id === person.id);
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

  // TODO This should be done in a utility function
  function calculateAge(dateOfBirth: string): number | undefined {
    const campStart = campDetailsStore.data?.startAt;

    const birthDate = new Date(dateOfBirth);
    const currentDate = campStart ? new Date(campStart) : new Date();

    if (isNaN(birthDate.getTime())) {
      return undefined;
    }

    const ageInMilliseconds = currentDate.getTime() - birthDate.getTime();
    const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

    return Math.floor(ageInYears);
  }

  function uniqueName(registration: Registration): string {
    const firstNameKey =
      settings.value.firstNameKey ?? settings.value.fullNameKey;
    const lastNameKey = settings.value.lastNameKey;
    const others = registrationsStore.data;

    if (!firstNameKey || others === undefined) {
      return 'Undefined';
    }

    return formatUniqueName(registration, others, firstNameKey, lastNameKey);
  }

  function mapRegistrationRoommate(registration: Registration): Roommate {
    const name = settings.value.fullNameKey
      ? formatPersonName(registration[settings.value.fullNameKey] as string)
      : uniqueName(registration);
    const age = settings.value.ageKey
      ? (registration[settings.value.ageKey] as number)
      : settings.value.dateOfBirthKey
      ? calculateAge(registration[settings.value.dateOfBirthKey] as string)
      : undefined;
    const gender = settings.value.genderKey
      ? (registration[settings.value.genderKey] as string)
      : undefined;
    const country = settings.value.countryKey
      ? (registration[settings.value.countryKey] as string)
      : undefined;
    const leader = settings.value.leaderKey
      ? (registration[settings.value.leaderKey] as boolean)
      : undefined;

    return {
      id: registration.id,
      name: name,
      age: age,
      gender: gender,
      country: country,
      leader: leader,
    };
  }

  function mapRoomRoommates(room: Room): Room {
    const registrations = registrationsStore.data as Registration[] | undefined;
    if (registrations === undefined) {
      room.roommates = [...Array(room.capacity).fill(null)];
      return room;
    }

    // Fill with registrations
    room.roommates = registrations
      .filter((registration) => {
        return registration.room_id === room.id;
      })
      .map((registration) => {
        return mapRegistrationRoommate(registration);
      });

    // Fill all remaining fields with null
    const diff = room.capacity - room.roommates.length;

    if (diff == 0) {
      return room;
    }

    // FIll all remaining slots with null values
    if (diff > 0) {
      room.roommates.push(...Array(diff).fill(null));
      return room;
    }

    // Room is overfilled. Remove them
    // TODO This must be done via store to update API...
    room.roommates.splice(room.roommates.length + diff, diff * -1);
    return room;
  }

  function mapRoomsRoommates(rooms: Room[]): Room[] {
    if (rooms === undefined) {
      return [];
    }

    // Map all registrations to their room
    for (const room of rooms) {
      mapRoomRoommates(room);
    }

    return rooms;
  }

  async function fetchRooms(campId?: string) {
    campId = campId ?? (route.params.camp as string | undefined);

    const cid = checkNotNullWithError(campId);
    await lazyFetch(async () => {
      const data = await apiService.fetchRooms(cid);
      return mapRoomsRoommates(data);
    });
  }

  async function createRoom(createData: Room): Promise<void> {
    const campId = route.params.camp as string | undefined;

    const cid = checkNotNullWithError(campId);
    await withProgressNotification('create', async () => {
      const room = await apiService.createRoom(cid, createData);

      data.value?.push(mapRoomRoommates(room));
    });
  }

  async function updateRoom(
    roomId: string | undefined,
    updateData: Partial<Room>
  ) {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const rid = checkNotNullWithNotification(roomId);
    // TODO Check if people need to be removed first
    await withProgressNotification('update', async () => {
      await apiService.updateRoom(cid, rid, updateData);

      // TODO Just replace the element instead
      //  Also remapping needs to be done
      await fetchRooms();
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

  async function addRoommate(roomId: string, roommateId: string) {
    const campId = route.params.camp as string;
    // TODO Update registration instead
  }

  async function removeRoommate(roomId: string, roommateId: string) {
    const campId = route.params.camp as string;
    // TODO Update registration instead
  }

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
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    addRoommate,
    removeRoommate,
    reset,
  };
});
