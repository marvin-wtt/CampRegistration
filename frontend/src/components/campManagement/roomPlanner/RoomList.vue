<template>
  <q-list
    bordered
    padding
    :dense
  >
    <q-item dense>
      <q-item-section>
        <q-item-label> {{ to(name) }} {{ roomGender }} </q-item-label>
      </q-item-section>

      <q-item-section
        v-if="editable || deletable"
        side
      >
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
                v-if="editable"
                v-close-popup
                clickable
                @click="editRoom"
              >
                <q-item-section>
                  {{ t('menu.edit') }}
                </q-item-section>
              </q-item>
              <!-- Delete -->
              <q-item
                v-if="deletable"
                v-close-popup
                clickable
                @click="deleteRoom"
              >
                <q-item-section class="text-negative">
                  {{ t('menu.delete') }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-item-section>
    </q-item>

    <room-list-item
      v-for="(_, index) in room.beds"
      :key="index"
      v-model="room.beds[index]!.person"
      :options
      :assignable
      :position="index + 1"
      :dense
      @update:model-value="(roommate) => onBedUpdate(index, roommate)"
    />
  </q-list>
</template>

<script lang="ts" setup>
import RoomListItem from 'components/campManagement/roomPlanner/RoomListItem.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Roommate, RoomWithRoommates } from 'src/types/Room';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const { t } = useI18n();
const { to } = useObjectTranslation();

const {
  room,
  name,
  people,
  dense = false,
  editable = false,
  deletable = false,
  assignable = false,
} = defineProps<{
  room: RoomWithRoommates;
  name: string | Record<string, string>;
  people: Roommate[];
  dense?: boolean;
  editable?: boolean;
  deletable?: boolean;
  assignable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'edit'): void;
  (e: 'update', position: number, roommate: Roommate | null): void;
}>();

const roomGender = computed<string | undefined>(() => {
  // Assume gender by first person in room
  return room.beds.map((bed) => bed.person?.gender).find((gender) => !!gender);
});

const isParticipantRoom = computed<boolean | undefined>(() => {
  // Exclude all beds free
  if (room.beds.filter((value) => !!value.person).length === 0) {
    return undefined;
  }

  return room.beds.some((bed) => {
    const person = bed.person;

    return person?.participant;
  });
});

const options = computed<Roommate[]>(() => {
  const genderFilter = (roomMate: Roommate | null): boolean => {
    if (roomGender.value === undefined) {
      return true;
    }

    return (
      roomMate?.gender !== undefined && roomMate?.gender === roomGender.value
    );
  };

  const roleFilter = (roomMate: Roommate | null): boolean => {
    if (isParticipantRoom.value === undefined) {
      return true;
    }

    return (
      roomMate?.participant !== undefined &&
      roomMate.participant === isParticipantRoom.value
    );
  };

  return people.filter(genderFilter).filter(roleFilter);
});

function onBedUpdate(position: number, roomMate: Roommate | null) {
  emit('update', position, roomMate);
}

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
