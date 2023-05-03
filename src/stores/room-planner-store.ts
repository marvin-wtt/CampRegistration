import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Room } from 'src/types/Room';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useNotification } from 'src/composables/notifications';
import {
  useAuthBus,
  useCampBus,
  useRegistrationBus,
} from 'src/composables/bus';
import { Camp } from 'src/types/Camp';
import { useRegistrationsStore } from 'stores/registration-store';
import { Registration } from 'src/types/Registration';
import { Roommate } from 'src/types/Roommate';
import { RegistrationSettings } from 'src/types/RegistrationSettings';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { formatPersonName, formatUniqueName } from 'src/utils/formatters';

export const useRoomPlannerStore = defineStore('room-planner', () => {
  const apiService = useAPIService();
  const quasar = useQuasar();
  const route = useRoute();
  const { t } = useI18n();
  const { withProgressNotification } = useNotification();
  const campDetailsStore = useCampDetailsStore();
  const registrationsStore = useRegistrationsStore();
  const campBus = useCampBus();
  const authBus = useAuthBus();
  const registrationBus = useRegistrationBus();

  const rooms = ref<Room[]>();
  const isLoading = ref<boolean>(false);
  const storeError = ref<string | object | null>(null);

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', async (camp: Camp) => {
    // TODO It should be monitored if the rooms are even needed at that point of time
    await fetchRooms(camp.id);
  });

  registrationBus.on('update', () => {
    rooms.value = mapRoomsRoommates(rooms.value ?? []);
  });

  const loading = computed<boolean>(() => {
    return isLoading.value || registrationsStore.isLoading;
  });

  const error = computed<string | object | null>(() => {
    return storeError.value ?? registrationsStore.error;
  });

  const settings = ref<RegistrationSettings>({
    firstNameKey: 'first_name',
    lastNameKey: 'last_name',
    dateOfBirthKey: 'date_of_birth',
    genderKey: 'gender',
    countryKey: 'country',
  });

  const availableRoommates = computed<Roommate[]>(() => {
    const localRooms = rooms.value;
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
    const campStart = campDetailsStore.data?.startDate;

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

  function reset() {
    rooms.value = undefined;
    isLoading.value = false;
    storeError.value = null;
  }

  async function fetchRooms(campId?: string) {
    isLoading.value = true;
    storeError.value = null;

    campId = campId ?? (route.params.camp as string | undefined);
    if (campId === undefined) {
      storeError.value = '404';
      isLoading.value = false;
      return;
    }

    try {
      const data = await apiService.fetchRooms(campId);
      rooms.value = mapRoomsRoommates(data);
    } catch (e: unknown) {
      storeError.value = e instanceof Error ? e.message : 'error';

      quasar.notify({
        type: 'negative',
        message: t('stores.room-planner.fetch.error'),
        position: 'top',
      });
    }

    isLoading.value = false;
  }

  async function createRoom(data: Room): Promise<void> {
    const campId = route.params.camp as string | undefined;

    if (campId === undefined) {
      storeError.value = '404';
      isLoading.value = false;
      return;
    }

    await withProgressNotification(
      async () => {
        const room = await apiService.createRoom(campId, data);

        rooms.value?.push(mapRoomRoommates(room));
      },
      {
        progress: {
          message: t('store.room-planner.create.progress'),
        },
        success: {
          message: t('store.room-planner.create.success'),
        },
        error: {
          message: t('store.room-planner.create.error'),
        },
      }
    );
  }

  async function updateRoom(roomId: string | undefined, data: Partial<Room>) {
    const campId = route.params.camp as string;

    if (campId === undefined || roomId === undefined) {
      quasar.notify({
        type: 'negative',
        message: t('stores.room-planner.update.invalid'),
        position: 'top',
      });
      return;
    }

    // TODO Check if people need to be removed first
    await withProgressNotification(
      async () => {
        await apiService.updateRoom(campId, roomId, data);

        // TODO Just replace the element instead
        //  Also remapping needs to be done
        await fetchRooms();
      },
      {
        progress: {
          message: t('stores.room-planner.update.progress'),
        },
        success: {
          message: t('stores.room-planner.update.success'),
        },
        error: {
          message: t('stores.room-planner.update.error'),
        },
      }
    );
  }

  async function deleteRoom(roomId: string) {
    const campId = route.params.camp as string;

    if (campId === undefined) {
      quasar.notify({
        type: 'negative',
        message: t('stores.room-planner.delete.invalid'),
        position: 'top',
      });
      return;
    }

    await withProgressNotification(
      async () => {
        await apiService.deleteRoom(campId, roomId);

        // Remove the room from the list
        const index = rooms.value?.findIndex((value) => value.id === roomId);
        if (index !== undefined && index != -1) {
          rooms.value?.splice(index, 1);
        }

        // TODO Inform bus - registration store needs to listen
      },
      {
        success: {
          message: t('stores.room-planner.delete.success'),
        },
        error: {
          message: t('stores.room-planner.delete.error'),
        },
      }
    );
  }

  async function addRoommate(roomId: string, roommateId: string) {
    const campId = route.params.camp as string;
    // TODO
    await apiService.createRoomRoommate(campId, roomId, roommateId);
  }

  async function removeRoommate(roomId: string, roommateId: string) {
    const campId = route.params.camp as string;
    // TODO
    await apiService.deleteRoomRoommate(campId, roomId, roommateId);
  }

  return {
    rooms,
    availableRoommates,
    loading,
    error,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    addRoommate,
    removeRoommate,
    reset,
  };
});
