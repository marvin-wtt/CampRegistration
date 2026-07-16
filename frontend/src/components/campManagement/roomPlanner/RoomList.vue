<template>
  <q-card
    flat
    class="room-card"
  >
    <div class="room-card__header">
      <div class="room-card__name ellipsis">
        {{ to(name) }}
      </div>

      <q-icon
        v-if="genderIcon"
        :name="genderIcon"
        :class="`room-card__gender-icon--${roomGenderKey}`"
        class="room-card__meta-icon"
        size="18px"
      >
        <q-tooltip>{{ t(`gender.${roomGenderKey}`) }}</q-tooltip>
      </q-icon>

      <q-icon
        v-if="isParticipantRoom === false"
        name="supervisor_account"
        class="room-card__meta-icon"
        size="18px"
      >
        <q-tooltip>{{ t('staffRoom') }}</q-tooltip>
      </q-icon>

      <div
        class="room-card__occupancy"
        :class="{ 'room-card__occupancy--full': isFull }"
      >
        {{ occupiedCount }}/{{ room.beds.length }}
      </div>

      <q-btn
        v-if="editable || deletable"
        class="room-card__menu-btn"
        icon="more_vert"
        flat
        round
        dense
        :aria-label="t('menu.label')"
      >
        <q-menu
          anchor="bottom right"
          self="top right"
        >
          <q-list style="min-width: 140px">
            <q-item
              v-if="editable"
              v-close-popup
              clickable
              @click="editRoom"
            >
              <q-item-section avatar>
                <q-icon
                  name="edit"
                  size="20px"
                />
              </q-item-section>
              <q-item-section>
                {{ t('menu.edit') }}
              </q-item-section>
            </q-item>

            <q-item
              v-if="deletable"
              v-close-popup
              clickable
              class="room-card__menu-delete"
              @click="deleteRoom"
            >
              <q-item-section avatar>
                <q-icon
                  name="delete"
                  size="20px"
                />
              </q-item-section>
              <q-item-section>
                {{ t('menu.delete') }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <div
      class="room-card__meter"
      role="presentation"
    >
      <div
        class="room-card__meter-fill"
        :class="{ 'room-card__meter-fill--full': isFull }"
        :style="{ width: `${occupancyPercent}%` }"
      />
    </div>

    <div class="room-card__beds">
      <room-list-item
        v-for="(_, index) in room.beds"
        :key="index"
        :model-value="room.beds[index]!.person"
        :options
        :assignable
        :position="index + 1"
        @update:model-value="(roommate) => onBedUpdate(index, roommate)"
      />
    </div>
  </q-card>
</template>

<script lang="ts" setup>
import RoomListItem from '@/components/campManagement/roomPlanner/RoomListItem.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Roommate, RoomWithRoommates } from '@/types/Room';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { t } = useI18n();
const { to } = useObjectTranslation();

const {
  room,
  name,
  people,
  editable = false,
  deletable = false,
  assignable = false,
  skipGenderFilter = false,
  skipRoleFilter = false,
} = defineProps<{
  room: RoomWithRoommates;
  name: string | Record<string, string>;
  people: Roommate[];
  editable?: boolean;
  deletable?: boolean;
  assignable?: boolean;
  skipGenderFilter?: boolean;
  skipRoleFilter?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'edit'): void;
  (e: 'update', position: number, roommate: Roommate | null): void;
}>();

const occupiedCount = computed<number>(() => {
  return room.beds.filter((bed) => !!bed.person).length;
});

const isFull = computed<boolean>(() => {
  return room.beds.length > 0 && occupiedCount.value === room.beds.length;
});

const occupancyPercent = computed<number>(() => {
  if (room.beds.length === 0) {
    return 0;
  }

  return (occupiedCount.value / room.beds.length) * 100;
});

const roomGender = computed<string | undefined>(() => {
  // Assume gender by first person in room
  return room.beds.map((bed) => bed.person?.gender).find((gender) => !!gender);
});

const roomGenderKey = computed<'male' | 'female' | undefined>(() => {
  const gender = roomGender.value?.toLowerCase();

  if (gender === 'm' || gender === 'male') {
    return 'male';
  }

  if (gender === 'f' || gender === 'female') {
    return 'female';
  }

  return undefined;
});

const genderIcon = computed<string | undefined>(() => {
  return roomGenderKey.value;
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
    if (skipGenderFilter || roomGender.value === undefined) {
      return true;
    }

    return (
      roomMate?.gender !== undefined && roomMate?.gender === roomGender.value
    );
  };

  const roleFilter = (roomMate: Roommate | null): boolean => {
    if (skipRoleFilter || isParticipantRoom.value === undefined) {
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

<style scoped>
.room-card {
  display: flex;
  flex-direction: column;

  border: 1px solid var(--md3-outline-variant);
  border-radius: 16px;

  background: var(--md3-surface);
  color: var(--md3-on-surface);
}

.room-card__header {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 12px 8px 10px 16px;
}

.room-card__name {
  flex: 1;
  min-width: 0;

  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.room-card__meta-icon {
  flex-shrink: 0;

  color: var(--md3-on-surface-variant);
}

.room-card__gender-icon--male {
  color: var(--md3-info);
}

.room-card__gender-icon--female {
  color: var(--md3-tertiary);
}

.room-card__occupancy {
  flex-shrink: 0;

  padding: 2px 8px;
  border-radius: 999px;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.room-card__occupancy--full {
  background: var(--md3-positive-container);
  color: var(--md3-on-positive-container);
}

.room-card__menu-btn {
  flex-shrink: 0;

  color: var(--md3-on-surface-variant);
}

.room-card__menu-delete {
  color: var(--md3-error);
}

.room-card__meter {
  height: 4px;
  margin: 0 16px;
  border-radius: 999px;

  background: var(--md3-surface-container-highest);

  overflow: hidden;
}

.room-card__meter-fill {
  height: 100%;
  border-radius: 999px;

  background: var(--md3-primary);

  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.room-card__meter-fill--full {
  background: var(--md3-positive);
}

.room-card__beds {
  display: flex;
  flex-direction: column;
  gap: 4px;

  padding: 12px;
}
</style>

<i18n lang="yaml" locale="en">
menu:
  label: 'Room actions'
  edit: 'Edit'
  delete: 'Delete'
staffRoom: 'Staff room'
gender:
  male: 'Male room'
  female: 'Female room'
</i18n>

<i18n lang="yaml" locale="de">
menu:
  label: 'Zimmeraktionen'
  edit: 'Bearbeiten'
  delete: 'Löschen'
staffRoom: 'Zimmer für Betreuende'
gender:
  male: 'Jungenzimmer'
  female: 'Mädchenzimmer'
</i18n>

<i18n lang="yaml" locale="fr">
menu:
  label: 'Actions de la chambre'
  edit: 'Modifier'
  delete: 'Supprimer'
staffRoom: 'Chambre des encadrants'
gender:
  male: 'Chambre des garçons'
  female: 'Chambre des filles'
</i18n>

<i18n lang="yaml" locale="pl">
menu:
  label: 'Akcje pokoju'
  edit: 'Edytuj'
  delete: 'Usuń'
staffRoom: 'Pokój kadry'
gender:
  male: 'Pokój chłopców'
  female: 'Pokój dziewcząt'
</i18n>

<i18n lang="yaml" locale="cs">
menu:
  label: 'Akce pokoje'
  edit: 'Upravit'
  delete: 'Smazat'
staffRoom: 'Pokoj vedoucích'
gender:
  male: 'Pokoj chlapců'
  female: 'Pokoj dívek'
</i18n>
