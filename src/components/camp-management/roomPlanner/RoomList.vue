<template>
  <q-list
    bordered
    padding
  >
    <q-item dense>
      <q-item-section>
        <q-item-label>
          {{ to(props.name) }}
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
import RoomListItem from 'components/camp-management/roomPlanner/RoomListItem.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { Room } from 'src/types/Room';
import ModifyRoomDialog from 'components/camp-management/roomPlanner/ModifyRoomDialog.vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { RoomMate } from 'src/types/RoomMate';

const quasar = useQuasar();
const { t } = useI18n();
const { to } = useObjectTranslation();

interface Props {
  name: string | Record<string, string>;
  modelValue: Room;
  people: (RoomMate | null)[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'update:modelValue', value: Room): void;
}>();

const room = computed<Room>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const gender = computed<string | undefined>(() => {
  let gender: string | undefined = undefined;

  room.value.roomMates.some((value) => {
    if (value?.gender === undefined) {
      return false;
    }

    gender = value.gender;
    return true;
  });

  return gender;
});

const leader = computed<boolean | undefined>(() => {
  let leader: boolean | undefined = undefined;

  room.value.roomMates.some((value) => {
    if (value?.leader === undefined) {
      return false;
    }

    leader = value.leader;
    return true;
  });

  return leader;
});

const options = computed<unknown[]>(() => {
  let people = props.people;

  if (gender.value !== undefined) {
    people = people.filter((value) => {
      return value?.gender !== undefined && value.gender === gender.value;
    });
  }

  if (leader.value !== undefined) {
    people = people.filter((value) => {
      return value?.leader !== undefined && value.leader === leader.value;
    });
  }

  return people;
});

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

<i18n lang="yaml" locale="en">
menu:
  edit: 'Edit'
  delete: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
menu:
  edit: 'Bearbeiten'
  delete: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
menu:
  edit: 'Modifier'
  delete: 'Supprimer'
</i18n>
