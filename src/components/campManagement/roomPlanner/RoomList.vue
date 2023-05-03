<template>
  <q-list
    bordered
    padding
    :dense="props.dense"
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
      v-for="(roomMate, index) in room.roommates"
      :key="index"
      v-model="room.roommates[index]"
      :options="options"
      :position="index + 1"
      :dense="props.dense"
    />
  </q-list>
</template>

<script lang="ts" setup>
import RoomListItem from 'components/campManagement/roomPlanner/RoomListItem.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Room } from 'src/types/Room';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { Roommate } from 'src/types/Roommate';

const { t } = useI18n();
const { to } = useObjectTranslation();

interface Props {
  name: string | Record<string, string>;
  modelValue: Room;
  people: (Roommate | null)[];
  dense?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dense: false,
});

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'edit'): void;
  (e: 'update:modelValue', value: Room): void;
}>();

const room = computed<Room>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const gender = computed<string | undefined>(() => {
  let gender: string | undefined = undefined;

  room.value.roommates.some((value) => {
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

  room.value.roommates.some((value) => {
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

function editRoom(): void {
  emit('edit');
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
