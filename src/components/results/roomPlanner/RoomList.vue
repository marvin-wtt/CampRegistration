<template>
  <q-list
    bordered
    padding
  >
    <q-item dense>
      <q-item-section>
        <q-item-label>
          {{ props.name }}
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <q-btn
          flat
          rounded
          dense
          icon="more_vert"
        >
          <q-menu
            anchor="bottom left"
            self="top middle"
          >
            <q-list style="min-width: 100px">
              <!-- Edit -->
              <q-item
                v-close-popup
                clickable
                @click="editRoom"
              >
                <q-item-section avatar>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>
                  {{ t('menu.edit') }}
                </q-item-section>
              </q-item>
              <!-- Delete -->
              <q-item
                v-close-popup
                clickable
                @click="deleteRoom"
              >
                <q-item-section avatar>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>
                  {{ t('menu.delete') }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-item-section>
    </q-item>

    <room-list-item
      v-for="(roomMate, index) in room.roomMates"
      :key="index"
      v-model="room.roomMates[index]"
      :options="options"
      :position="index + 1"
    />
  </q-list>
</template>

<script lang="ts" setup>
import RoomListItem from 'components/results/roomPlanner/RoomListItem.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { Room } from 'src/types/Room';
import ModifyRoomDialog from 'components/results/roomPlanner/ModifyRoomDialog.vue';

interface Props {
  name: string;
  modelValue: Room;
  people: unknown[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'update:modelValue', value: Room): void;
}>();

const quasar = useQuasar();
const { t } = useI18n();

const room = computed<Room>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const gender = computed<string | undefined>(() => {
  let gender: string | undefined = undefined;

  room.value.roomMates.some((value) => {
    if (!hasGenderProperty(value)) {
      return false;
    }

    gender = value.gender;
    return true;
  });

  return gender;
});

const teamer = computed<boolean | undefined>(() => {
  let teamer: boolean | undefined = undefined;

  room.value.roomMates.some((value) => {
    if (!hasTeamerProperty(value)) {
      return false;
    }

    teamer = value.teamer;
    return true;
  });

  return teamer;
});

const options = computed<unknown[]>(() => {
  let people = props.people;

  if (gender.value !== undefined) {
    people = people.filter((value) => {
      return hasGenderProperty(value) && value.gender === gender.value;
    });
  }

  if (teamer.value !== undefined) {
    people = people.filter((value) => {
      return hasTeamerProperty(value) && value.teamer === teamer.value;
    });
  }

  return people;
});

function hasGenderProperty(value: unknown): value is { gender: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'gender' in value &&
    typeof value.gender === 'string'
  );
}

function hasTeamerProperty(value: unknown): value is { teamer: boolean } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'teamer' in value &&
    typeof value.teamer === 'boolean'
  );
}

function editRoom(room: Room): void {
  quasar
    .dialog({
      component: ModifyRoomDialog,
      componentProps: {
        room: room,
        mode: 'edit',
      },
      persistent: true,
    })
    .onOk((payload: Room) => {
      room = payload;
    });
}

function deleteRoom(): void {
  emit('delete');
}
</script>

<style scoped></style>
