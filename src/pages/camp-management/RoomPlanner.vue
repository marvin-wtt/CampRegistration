<template>
  <page-state-handler
    :error="error"
    :prevent-leave="updateInProgress"
    padding
    class="column"
  >
    <!-- Header -->
    <div class="row justify-between">
      <p class="col text-h4">
        {{ t('title') }}
      </p>

      <div class="col-shrink">
        <q-btn
          color="primary"
          rounded
          label="add"
          icon="add"
          :disable="loading"
          @click="addRoom"
        />

        <q-btn
          round
          icon="settings"
          :disable="loading"
          @click="onSettings"
        />
      </div>
    </div>

    <!-- Skeleton loader -->
    <div
      v-if="loading"
      class="row items-start"
    >
      <room-list-skeleton
        v-for="index in 4"
        :key="index"
        :capacity="4"
        class="q-ma-sm"
        style="max-width: 500px; min-width: 300px"
      />
    </div>

    <!-- Content -->
    <div
      v-else
      class="row items-start"
    >
      <transition-group name="fade">
        <room-list
          v-for="(room, index) in rooms"
          :key="room.name"
          v-model="rooms[index]"
          :name="room.name"
          :people="availablePeople"
          :room-mates="room.roomMates"
          class="q-ma-sm"
          style="max-width: 500px; min-width: 300px"
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
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import RoomList from 'components/camp-management/roomPlanner/RoomList.vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useCampRegistrationsStore } from 'stores/camp/camp-registration-store';
import { Room } from 'src/types/Room';
import { useQuasar } from 'quasar';
import ModifyRoomDialog from 'components/camp-management/roomPlanner/ModifyRoomDialog.vue';
import PageStateHandler from 'components/PageStateHandler.vue';
import { Registration } from 'src/types/Registration';
import RoomListSkeleton from 'components/camp-management/roomPlanner/RoomListSkeleton.vue';
import { RoomMate } from 'src/types/RoomMate';

const quasar = useQuasar();
const { t } = useI18n();
const registrationsStore = useCampRegistrationsStore();
const registrations = storeToRefs(registrationsStore);

const addLoading = ref(false);

const loading = computed<boolean>(() => {
  return registrationsStore.isLoading;
});

const error = computed<unknown>(() => {
  return registrationsStore.error;
});

const updateInProgress = computed<boolean>(() => {
  return false;
});

const rooms = computed<Room[]>(() => {
  return testRooms.value.map((room) => {
    const diff = room.capacity - room.roomMates.length;

    if (diff == 0) {
      return room;
    }

    // FIll all remaining slots with null values
    if (diff > 0) {
      room.roomMates.push(...Array(diff).fill(null));
      return room;
    }

    // Room is overfilled. Remove them
    room.roomMates.splice(room.roomMates.length + diff, diff * -1);

    return room;
  });
});

const testRooms = ref<Room[]>([
  {
    id: '',
    name: 'Room 1',
    capacity: 4,
    roomMates: [],
  },
  {
    id: '',
    name: 'Room 2',
    capacity: 5,
    roomMates: [],
  },
  {
    id: '',
    name: 'Room 3',
    capacity: 4,
    roomMates: [],
  },
]);

const availablePeople = computed<RoomMate[]>(() => {
  let results: Registration[] | undefined = registrations.data.value;

  if (results === undefined) {
    return [];
  }

  // Filter out people who are already in a group
  results = results.filter((person) => {
    return !rooms.value.some((room) => {
      return room.roomMates.some((value) => value?.id === person.id);
    });
  });

  // TODO Set values based on settings
  // TODO Generate values if needed - name should be unique
  // Convert registrations to custom object
  return results.map((roomMate) => {
    return {
      id: roomMate.id,
      name: roomMate.first_name,
      age: roomMate.age,
      gender: roomMate.gender,
      country: roomMate.country,
      leader: false,
    } as RoomMate;
  });
});

function addRoom() {
  const room: Room = {
    id: 'filled-by-server',
    name: '',
    capacity: 0,
    roomMates: [],
  };

  quasar
    .dialog({
      component: ModifyRoomDialog,
      componentProps: {
        mode: 'create',
        room: room,
      },
    })
    .onOk((payload) => {
      // TODO Push the room
    });
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
