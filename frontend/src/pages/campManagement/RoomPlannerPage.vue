<template>
  <page-state-handler
    :error
    :prevent-leave="updateInProgress"
    padding
    class="column"
  >
    <div
      v-if="!loading && rooms.length === 0"
      class="col self-center content-center text-h3 text-center"
    >
      {{ t('noEntries') }}
    </div>

    <!-- Content -->
    <div class="row items-start">
      <template v-if="loading">
        <room-list-skeleton
          v-for="index in 4"
          :key="index"
          :capacity="4"
          class="q-ma-sm"
          style="max-width: 500px; min-width: 275px"
        />
      </template>

      <!-- Content -->
      <template v-else>
        <transition-group name="fade">
          <room-list
            v-for="(room, index) in rooms"
            :key="room.id"
            v-model="rooms[index]!"
            :name="room.name"
            :people="availablePeople"
            class="q-ma-sm"
            style="max-width: 500px; min-width: 275px"
            :editable="can('camp.rooms.edit')"
            :deletable="can('camp.rooms.delete')"
            :assignable="can('camp.rooms.beds.edit')"
            @edit="editRoom(room)"
            @delete="deleteRoom(room.id)"
            @update="(position, val) => onBedUpdate(room, position, val)"
          />
        </transition-group>

        <!-- Room adder skeleton -->
        <transition name="fade">
          <room-list-skeleton
            v-if="addLoading"
            :capacity="4"
            class="q-ma-sm"
            style="max-width: 500px; min-width: 300px"
          />
        </transition>
      </template>
    </div>

    <!-- Action buttons -->
    <q-page-sticky
      v-if="can('camp.rooms.edit')"
      position="bottom-right"
      :offset="[18, 18]"
    >
      <q-fab
        color="primary"
        icon="keyboard_arrow_up"
        direction="up"
      >
        <!-- Room ordering is currently not supported -->
        <!-- TODO Enable when ordering is supported -->
        <q-fab-action
          color="primary"
          icon="swap_vert"
          :disable="rooms.length === 0 && false"
          @click="orderRooms"
        />
        <q-fab-action
          color="primary"
          icon="add"
          @click="addRoom"
        />
      </q-fab>
    </q-page-sticky>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import type { Roommate, RoomWithRoommates } from 'src/types/Room';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import RoomList from 'components/campManagement/roomPlanner/RoomList.vue';
import RoomListSkeleton from 'components/campManagement/roomPlanner/RoomListSkeleton.vue';
import RoomOrderDialog from 'components/campManagement/roomPlanner/dialogs/RoomOrderDialog.vue';
import RoomCreateDialog from 'components/campManagement/roomPlanner/dialogs/RoomCreateDialog.vue';
import RoomEditDialog from 'components/campManagement/roomPlanner/dialogs/RoomEditDialog.vue';
import type {
  Room,
  RoomCreateData,
  RoomUpdateData,
  Registration,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { usePermissions } from 'src/composables/permissions';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { formatPersonName } from 'src/utils/formatters';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { useAPIService } from 'src/services/APIService';

const quasar = useQuasar();
const { t } = useI18n();
const apiService = useAPIService();
const campDetailsStore = useCampDetailsStore();
const registrationsStore = useRegistrationsStore();
const registrationHelper = useRegistrationHelper();
const { can } = usePermissions();

const addLoading = ref(false);

const {
  data,
  isLoading,
  error: roomError,
  withProgressNotification,
  withErrorNotification,
  lazyFetch,
  queryParam,
  asyncUpdate,
  requestPending,
  checkNotNullWithError,
} = useServiceHandler<Room[]>();

// TODO Inform camp bus go update or update registrations

registrationsStore.fetchData();
fetchRooms();

const loading = computed<boolean>(() => {
  return registrationsStore.isLoading && isLoading.value;
});

const error = computed<string | null>(() => {
  return registrationsStore.error ?? roomError.value;
});

const updateInProgress = computed<boolean>(() => {
  return requestPending.value;
});

const locales = computed<string[] | undefined>(() => {
  return campDetailsStore.data?.countries;
});

const rooms = computed<RoomWithRoommates[]>(() => {
  if (!data.value) {
    return [];
  }

  return data.value.map(mapResponseRoom);
});

const availablePeople = computed<Roommate[]>(() => {
  const localRooms = rooms.value;
  const registrations: Registration[] | undefined = registrationsStore.data;

  if (localRooms === undefined || registrations === undefined) {
    return [];
  }

  const waitingListFilter = (registration: Registration): boolean => {
    return !registration.waitingList;
  };

  // Filter out people who are already in a group
  const alreadyAssignedFilter = (registration: Registration): boolean => {
    return !localRooms.some((room) => {
      return room.beds.some((value) => value?.person?.id === registration.id);
    });
  };

  // Map to roommate type and sort by age
  return registrations
    .filter(waitingListFilter)
    .filter(alreadyAssignedFilter)
    .map(mapRegistrationRoommate)
    .sort((a, b) => {
      return (a.age ?? 999) - (b.age ?? 999);
    });
});

async function fetchRooms() {
  const campId = queryParam('camp');

  const cid = checkNotNullWithError(campId);
  await lazyFetch(() => apiService.fetchRooms(cid));
}

function addRoom() {
  quasar
    .dialog({
      component: RoomCreateDialog,
      componentProps: {
        locales: locales.value,
      },
    })
    .onOk((payload: RoomCreateData) => {
      createRoom(payload);
    });
}

function editRoom(room: RoomWithRoommates): void {
  const roomUpdate: RoomUpdateData = {
    name: room.name,
  };

  quasar
    .dialog({
      component: RoomEditDialog,
      componentProps: {
        room: roomUpdate,
        locales,
      },
    })
    .onOk((payload: RoomUpdateData) => {
      updateRoom(room.id, payload);
    });
}

function orderRooms() {
  quasar
    .dialog({
      component: RoomOrderDialog,
      componentProps: {
        rooms: rooms.value,
      },
      persistent: true,
    })
    .onOk((payload: RoomWithRoommates[]) => {
      // TODO Rooms needs order property so safe the order
      payload.forEach((room: RoomWithRoommates) => {
        updateRoom(room.id, room);
      });
    });
}

function onBedUpdate(
  room: RoomWithRoommates,
  position: number,
  roommate: Roommate | null,
) {
  updateBed(room, position, roommate);
}

async function createRoom(
  createData: RoomCreateData,
): Promise<Room | undefined> {
  const campId = queryParam('camp');

  return withProgressNotification('create', async () => {
    const room = await apiService.createRoom(campId, createData);

    data.value?.push(room);

    return room;
  });
}

async function updateRoom(
  roomId: string,
  updateData: RoomUpdateData,
): Promise<Room | undefined> {
  const campId = queryParam('camp');

  return withProgressNotification('update', async () => {
    const room = await apiService.updateRoom(campId, roomId, updateData);

    const index = data.value?.findIndex((value) => value.id === roomId);
    if (index !== undefined && index != -1) {
      data.value?.splice(index, 1, room);
    }

    return room;
  });
}

async function deleteRoom(roomId: string) {
  const campId = queryParam('camp');

  await withProgressNotification('delete', async () => {
    await apiService.deleteRoom(campId, roomId);

    // Remove the room from the list
    const index = data.value?.findIndex((value) => value.id === roomId);
    if (index !== undefined && index != -1) {
      data.value?.splice(index, 1);
    }
  });
}

async function updateBed(
  room: RoomWithRoommates,
  position: number,
  person: Roommate | null,
) {
  const campId = queryParam('camp');
  const roomId = room.id;
  const bedId = room.beds[position]?.id;
  const registrationId = person?.id ?? null;

  if (bedId === undefined) {
    return;
  }

  asyncUpdate(() => {
    return withErrorNotification('update-bed', () => {
      return apiService.updateBed(campId, roomId, bedId, registrationId);
    });
  });

  // Optimistic update
  room.beds[position]!.person = person;
}

function mapRegistrationRoommate(registration: Registration): Roommate {
  const name = formatPersonName(registrationHelper.uniqueName(registration));
  const age = registrationHelper.age(registration);
  const gender = registrationHelper.gender(registration);
  const country = registrationHelper.country(registration);
  const participant = registrationHelper.participant(registration);

  return {
    id: registration.id,
    name,
    age,
    gender,
    country,
    participant,
  };
}

function mapResponseRoom(room: Room): RoomWithRoommates {
  return {
    id: room.id,
    name: room.name,
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
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<i18n lang="yaml" locale="en">
noEntries: 'Create new rooms to start'

request:
  fetch:
    error: 'Failed to fetch rooms'
  create:
    progress: 'Creating room...'
    success: 'Room created successfully'
    error: 'Failed to create room'
    invalid: 'Invalid camp id'
  update:
    progress: 'Updating room...'
    success: 'Room updated successfully'
    error: 'Failed to update room'
    invalid: 'Invalid room id or camp id'
  delete:
    progress: 'Deleting room...'
    success: 'Room deleted successfully'
    error: 'Failed to delete room'
    invalid: 'Invalid room id or camp id'
</i18n>

<i18n lang="yaml" locale="de">
noEntries: 'Neue Räume erstellen, um zu beginnen'

request:
  fetch:
    error: 'Fehler beim Abrufen der Zimmer'
  create:
    progress: 'Zimmer wird erstellt...'
    success: 'Zimmer erfolgreich erstellt'
    error: 'Fehler beim Erstellen des Zimmers'
    invalid: 'Ungültige Camp-ID'
  update:
    progress: 'Zimmer wird aktualisiert...'
    success: 'Zimmer erfolgreich aktualisiert'
    error: 'Fehler beim Aktualisieren des Zimmers'
    invalid: 'Ungültige Zimmer-ID oder Camp-ID'
  delete:
    progress: 'Zimmer wird gelöscht...'
    success: 'Zimmer erfolgreich gelöscht'
    error: 'Fehler beim Löschen des Zimmers'
    invalid: 'Ungültige Zimmer-ID oder Camp-ID'
</i18n>

<i18n lang="yaml" locale="fr">
noEntries: 'Créer de nouvelles pièces pour commencer'

request:
  fetch:
    error: 'Échec de la récupération des chambres'
  create:
    progress: 'Création de la chambre en cours...'
    success: 'Chambre créée avec succès'
    error: 'Impossible de créer la chambre'
    invalid: 'ID du camp invalide'
  update:
    progress: 'Mise à jour de la chambre en cours...'
    success: 'Chambre mise à jour avec succès'
    error: 'Impossible de mettre à jour la chambre'
    invalid: 'ID de la chambre ou du camp invalide'
  delete:
    progress: 'Suppression de la chambre en cours...'
    success: 'Chambre supprimée avec succès'
    error: 'Impossible de supprimer la chambre'
    invalid: 'ID de la chambre ou du camp invalide'
#
</i18n>
