<template>
  <page-state-handler
    :error="error"
    :prevent-leave="updateInProgress"
    padding
    class="column"
  >
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
            :key="room.name"
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
        <q-fab-action
          color="primary"
          icon="swap_vert"
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
import { Room } from 'src/types/Room';
import { Roommate } from 'src/types/Roommate';
import ModifyRoomDialog from 'components/campManagement/roomPlanner/dialogs/ModifyRoomDialog.vue';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import RoomList from 'components/campManagement/roomPlanner/RoomList.vue';
import RoomListSkeleton from 'components/campManagement/roomPlanner/RoomListSkeleton.vue';
import OrderRoomsDialog from 'components/campManagement/roomPlanner/dialogs/OrderRoomsDialog.vue';

const quasar = useQuasar();
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

const error = computed<unknown>(() => {
  return registrationsStore.error ?? roomStore.error;
});

const updateInProgress = computed<boolean>(() => {
  return roomStore.requestPending;
});

const locales = computed<string[] | undefined>(() => {
  return campDetailsStore.data?.countries;
});

const rooms = computed<Room[]>(() => {
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
  const room: Omit<Room, 'beds'> = {
    id: 'filled-by-server',
    name: '',
    capacity: 0,
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
      roomStore.updateRoom(room.id, payload);
    });
}

function orderRooms() {
  quasar
    .dialog({
      component: OrderRoomsDialog,
      componentProps: {
        rooms: rooms.value,
      },
      persistent: true,
    })
    .onOk((payload: Room[]) => {
      // TODO Compare changes and update
    });
}

function deleteRoom(id: string) {
  roomStore.deleteRoom(id);
}

function onBedUpdate(room: Room, position: number, roommate: Roommate | null) {
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

<!-- TODO Translations -->
<i18n lang="yaml" locale="en">
title: 'Room Planner'
</i18n>
