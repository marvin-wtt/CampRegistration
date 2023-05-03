<template>
  <page-state-handler
    :error="error"
    :prevent-leave="updateInProgress"
    style="padding-top: 66px"
    padding
    class="column"
  >
    <!-- Header -->

    <!-- Content -->
    <div class="row items-start">
      <template v-if="loading">
        <room-list-skeleton
          v-for="index in 4"
          :key="index"
          :capacity="4"
          class="q-ma-sm"
          style="max-width: 500px; min-width: 300px"
        />
      </template>

      <!-- Content -->
      <template v-else>
        <transition-group name="fade">
          <!-- TODO events -->
          <room-list
            v-for="(room, index) in rooms"
            :key="room.name"
            v-model="rooms[index]"
            :name="room.name"
            :people="availablePeople"
            :room-mates="room.roommates"
            class="q-ma-sm"
            style="max-width: 500px; min-width: 300px"
            @update:model-value="onRoomUpdate(room)"
            @edit="editRoom(room)"
            @delete="deleteRoom(room.id)"
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

    <q-page-sticky
      expand
      position="top"
    >
      <q-toolbar class="bg-dark text-white row justify-between">
        <q-toolbar-title>
          {{ t('title') }}
        </q-toolbar-title>

        <div class="col-shrink">
          <create-room-button
            color="primary"
            rounded
            icon="add"
            :disable="loading"
            @add="addRoom"
            @add-multiple="addMultipleRooms"
          />

          <q-btn
            round
            icon="settings"
            :disable="loading"
            @click="onSettings"
          />
        </div>
      </q-toolbar>
    </q-page-sticky>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import { useRoomPlannerStore } from 'stores/room-planner-store';
import { Room } from 'src/types/Room';
import { Roommate } from 'src/types/Roommate';
import CreateRoomButton from 'components/campManagement/roomPlanner/CreateRoomButton.vue';
import ModifyRoomDialog from 'components/campManagement/roomPlanner/dialogs/ModifyRoomDialog.vue';
import PageStateHandler from 'components/PageStateHandler.vue';
import RoomList from 'components/campManagement/roomPlanner/RoomList.vue';
import RoomListSkeleton from 'components/campManagement/roomPlanner/RoomListSkeleton.vue';

const quasar = useQuasar();
const { t } = useI18n();
const campDetailsStore = useCampDetailsStore();
const registrationsStore = useRegistrationsStore();
const roomStore = useRoomPlannerStore();

const addLoading = ref(false);

roomStore.fetchRooms();

const loading = computed<boolean>(() => {
  return roomStore.loading;
});

const error = computed<unknown>(() => {
  return registrationsStore.error ?? roomStore.error;
});

// TODO
const updateInProgress = computed<boolean>(() => {
  return false;
});

const locales = computed<string[] | undefined>(() => {
  return campDetailsStore.data?.countries;
});

const rooms = computed<Room[]>(() => {
  const rooms = roomStore.rooms;
  if (rooms === undefined) {
    return [];
  }

  return rooms;
});

const availablePeople = computed<Roommate[]>(() => {
  return roomStore.availableRoommates;
});

function addRoom() {
  const room: Room = {
    id: 'filled-by-server',
    name: '',
    capacity: 0,
    roommates: [],
  };

  quasar
    .dialog({
      component: ModifyRoomDialog,
      componentProps: {
        mode: 'create',
        room: room,
        locales: locales.value,
      },
    })
    .onOk((payload) => {
      roomStore.createRoom(payload);
    });
}

function editRoom(room: Room): void {
  quasar
    .dialog({
      component: ModifyRoomDialog,
      componentProps: {
        room: room,
        mode: 'edit',
        locales: locales,
      },
      persistent: true,
    })
    .onOk((payload: Room) => {
      // TODO Trigger store action
    });
}

function deleteRoom(id: string) {
  roomStore.deleteRoom(id);
}

function addMultipleRooms() {
  // TODO Create dialog
}

function onRoomUpdate(room: Room) {
  // TODO Detect changes
}

function onSettings() {
  // TODO open settings dialog
  // age or date_of_birth
  // first_name
  // last_name
  // full_name
  // country
  // teamer / leader
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

<!-- TODO Translations -->
<i18n lang="yaml" locale="en">
title: 'Room Planner'
</i18n>
