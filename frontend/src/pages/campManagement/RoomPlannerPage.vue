<template>
  <page-state-handler
    :error="error"
    :prevent-leave="updateInProgress"
    padding
    class="column"
  >
    <div
      v-if="!loading && rooms.length === 0"
      class="col self-center content-center text-h3"
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
            v-model="rooms[index]"
            :name="room.name"
            :people="availablePeople"
            class="q-ma-sm"
            style="max-width: 500px; min-width: 275px"
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
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import { useRoomPlannerStore } from 'stores/room-planner-store';
import { Roommate, RoomWithRoommates } from 'src/types/Room';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import RoomList from 'components/campManagement/roomPlanner/RoomList.vue';
import RoomListSkeleton from 'components/campManagement/roomPlanner/RoomListSkeleton.vue';
import RoomOrderDialog from 'components/campManagement/roomPlanner/dialogs/RoomOrderDialog.vue';
import RoomCreateDialog from 'components/campManagement/roomPlanner/dialogs/RoomCreateDialog.vue';
import RoomEditDialog from 'components/campManagement/roomPlanner/dialogs/RoomEditDialog.vue';
import type {
  RoomCreateData,
  RoomUpdateData,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';

const quasar = useQuasar();
const { t } = useI18n();
const campDetailsStore = useCampDetailsStore();
const registrationsStore = useRegistrationsStore();
const roomStore = useRoomPlannerStore();

const addLoading = ref(false);

onMounted(async () => {
  await registrationsStore.fetchData();
  await roomStore.fetchRooms();
});

const loading = computed<boolean>(() => {
  return roomStore.isLoading;
});

const error = computed<string | null>(() => {
  return registrationsStore.error ?? roomStore.error;
});

const updateInProgress = computed<boolean>(() => {
  return roomStore.requestPending;
});

const locales = computed<string[] | undefined>(() => {
  return campDetailsStore.data?.countries;
});

const rooms = computed<RoomWithRoommates[]>(() => {
  const rooms = roomStore.data;
  if (rooms === undefined) {
    return [];
  }

  return rooms;
});

const availablePeople = computed<Roommate[]>(() => {
  return roomStore.availableRoommates;
});

function addRoom() {
  quasar
    .dialog({
      component: RoomCreateDialog,
      componentProps: {
        locales: locales.value,
      },
    })
    .onOk((payload: RoomCreateData) => {
      roomStore.createRoom(payload);
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
      roomStore.updateRoom(room.id, payload);
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
      // TODO Compare changes and update
    });
}

function deleteRoom(id: string) {
  roomStore.deleteRoom(id);
}

function onBedUpdate(
  room: RoomWithRoommates,
  position: number,
  roommate: Roommate | null,
) {
  roomStore.updateBed(room, position, roommate);
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
</i18n>

<i18n lang="yaml" locale="de">
noEntries: 'Neue Räume erstellen, um zu beginnen'
</i18n>

<i18n lang="yaml" locale="fr">
noEntries: 'Créer de nouvelles pièces pour commencer'
</i18n>
