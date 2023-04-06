<template>
  <q-page
    padding
    class="column"
  >
    <!-- content -->

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
          @click="addRoom"
        />
      </div>
    </div>

    <div class="row items-start">
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
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import RoomList from 'components/results/roomPlanner/RoomList.vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useCampRegistrationsStore } from 'stores/camp/camp-registration-store';
import { Room } from 'src/types/Room';
import { useQuasar } from 'quasar';
import ModifyRoomDialog from 'components/results/roomPlanner/ModifyRoomDialog.vue';

const quasar = useQuasar();
const { t } = useI18n();
const campRegistrationsStore = useCampRegistrationsStore();
const registrations = storeToRefs(campRegistrationsStore);

const rooms = ref<Room[]>([
  {
    name: 'Room 1',
    capacity: 4,
    roomMates: [null, null, null, null],
  },
  {
    name: 'Room 2',
    capacity: 5,
    roomMates: [null, null, null, null, null],
  },
  {
    name: 'Room 3',
    capacity: 4,
    roomMates: [null, null, null, null],
  },
  {
    name: 'Room 4',
    capacity: 2,
    roomMates: [null, null],
  },
]);

const availablePeople = computed<unknown[]>(() => {
  let results: unknown[] = registrations.data.value as unknown[];

  results = results.filter((person) => {
    return !rooms.value.some((room) => {
      return room.roomMates.includes(person);
    });
  });

  // Format names
  return results.map((value) => {
    return typeof value !== 'string'
      ? value
      : value
          .toLowerCase()
          .replace(/(^|\s|-)(\w)/g, (match: string, p1: string, p2: string) => {
            return p1 + p2.toUpperCase();
          });
  });
});

function addRoom() {
  const room: Room = {
    name: '',
    capacity: 0,
    roomMates: [],
  };

  quasar.dialog({
    component: ModifyRoomDialog,
    componentProps: {
      mode: 'create',
      room: room,
    },
  });
}
</script>
