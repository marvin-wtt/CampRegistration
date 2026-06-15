<template>
  <div
    class="bed-row"
    :class="{
      'bed-row--occupied': model !== null,
      'bed-row--empty': model === null,
      'bed-row--assignable': assignable,
    }"
    :tabindex="assignable ? 0 : undefined"
    :role="assignable ? 'button' : undefined"
    :aria-label="ariaLabel"
    @click="onRowClick"
    @keyup.enter="openPicker"
  >
    <!-- Occupied bed -->
    <template v-if="model">
      <div
        class="bed-row__avatar"
        :class="avatarClass"
      >
        {{ initials }}
      </div>

      <div class="bed-row__text">
        <span class="bed-row__name ellipsis">{{ model.name }}</span>
        <span
          v-if="model.age !== undefined"
          class="bed-row__age"
        >
          {{ model.age }}
        </span>
      </div>

      <country-icon
        v-if="model.country"
        :country="model.country"
        class="bed-row__flag"
      />

      <q-btn
        v-if="assignable"
        class="bed-row__clear"
        icon="close"
        size="10px"
        flat
        round
        dense
        :aria-label="t('clear')"
        @click.stop="clearBed"
      />
    </template>

    <!-- Empty bed -->
    <template v-else>
      <div class="bed-row__avatar bed-row__avatar--empty">
        {{ position }}
      </div>

      <div class="bed-row__text">
        <span class="bed-row__name bed-row__name--placeholder">
          {{ assignable ? t('assign') : t('empty') }}
        </span>
      </div>

      <q-icon
        v-if="assignable"
        class="bed-row__assign-icon"
        name="person_add"
        size="18px"
      />
    </template>

    <!-- Desktop picker -->
    <q-menu
      v-if="assignable && !useSheet"
      v-model="menuOpen"
      fit
      anchor="bottom left"
      self="top left"
    >
      <bed-picker-list
        :options
        :removable="model !== null"
        autofocus
        @select="selectPerson"
        @clear="clearBed"
      />
    </q-menu>
  </div>

  <!-- Mobile picker -->
  <bottom-sheet
    v-if="assignable && useSheet"
    v-model="sheetOpen"
    no-padding
  >
    <bed-picker-list
      :options
      :removable="model !== null"
      @select="selectPerson"
      @clear="clearBed"
    />
  </bottom-sheet>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import BottomSheet from 'components/BottomSheet.vue';
import BedPickerList from 'components/campManagement/roomPlanner/BedPickerList.vue';
import type { Roommate } from 'src/types/Room';

const quasar = useQuasar();
const { t } = useI18n();

const model = defineModel<Roommate | null>({
  required: true,
});

const {
  position,
  options,
  assignable = false,
} = defineProps<{
  position: number;
  options: Roommate[];
  assignable?: boolean;
}>();

const menuOpen = ref(false);
const sheetOpen = ref(false);

const useSheet = computed<boolean>(() => {
  return quasar.screen.xs;
});

const initials = computed<string>(() => {
  if (!model.value) {
    return '';
  }

  return model.value.name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
});

const avatarClass = computed<string | undefined>(() => {
  const gender = model.value?.gender?.toLowerCase();

  if (gender === 'm' || gender === 'male') {
    return 'bed-row__avatar--male';
  }

  if (gender === 'f' || gender === 'female') {
    return 'bed-row__avatar--female';
  }

  return undefined;
});

const ariaLabel = computed<string>(() => {
  return model.value
    ? t('bedOf', { position, name: model.value.name })
    : t('emptyBed', { position });
});

function onRowClick() {
  // The q-menu attaches to this row and toggles itself on click;
  // only the bottom sheet needs manual opening.
  if (assignable && useSheet.value) {
    sheetOpen.value = true;
  }
}

function openPicker() {
  if (!assignable) {
    return;
  }

  if (useSheet.value) {
    sheetOpen.value = true;
  } else {
    menuOpen.value = true;
  }
}

function selectPerson(person: Roommate) {
  closePicker();
  model.value = person;
}

function clearBed() {
  closePicker();
  model.value = null;
}

function closePicker() {
  menuOpen.value = false;
  sheetOpen.value = false;
}
</script>

<style scoped>
.bed-row {
  display: flex;
  align-items: center;
  gap: 10px;

  min-height: 44px;
  padding: 6px 8px;
  border-radius: 12px;

  outline: none;
}

.bed-row--assignable {
  cursor: pointer;

  transition: background-color 0.15s ease;
}

.bed-row--occupied.bed-row--assignable:hover,
.bed-row--occupied.bed-row--assignable:focus-visible {
  background: var(--md3-surface-container);
}

.bed-row--empty {
  border: 1.5px dashed var(--md3-outline-variant);

  color: var(--md3-on-surface-variant);
}

.bed-row--empty.bed-row--assignable:hover,
.bed-row--empty.bed-row--assignable:focus-visible {
  border-color: var(--md3-primary);

  background: rgba(var(--md3-primary-rgb), 0.05);
  color: var(--md3-primary);
}

.bed-row__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 32px;
  height: 32px;
  border-radius: 50%;

  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.bed-row__avatar--male {
  background: var(--md3-info-container);
  color: var(--md3-on-info-container);
}

.bed-row__avatar--female {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.bed-row__avatar--empty {
  border: 1.5px dashed var(--md3-outline-variant);

  background: transparent;
  color: inherit;

  font-size: 11px;
}

.bed-row--empty.bed-row--assignable:hover .bed-row__avatar--empty,
.bed-row--empty.bed-row--assignable:focus-visible .bed-row__avatar--empty {
  border-color: currentcolor;
}

.bed-row__text {
  display: flex;
  align-items: baseline;
  gap: 6px;

  flex: 1;
  min-width: 0;
}

.bed-row__name {
  font-size: 14px;
  font-weight: 500;
}

.bed-row__name--placeholder {
  font-weight: 400;
}

.bed-row__age {
  flex-shrink: 0;

  color: var(--md3-on-surface-variant);

  font-size: 12px;
}

.bed-row__flag {
  flex-shrink: 0;

  width: 18px;
  border-radius: 2px;
}

.bed-row__clear {
  flex-shrink: 0;

  color: var(--md3-on-surface-variant);

  opacity: 0;

  transition: opacity 0.15s ease;
}

.bed-row:hover .bed-row__clear,
.bed-row:focus-within .bed-row__clear {
  opacity: 1;
}

/* Touch devices: no hover, keep the clear action visible */
@media (hover: none) {
  .bed-row__clear {
    opacity: 1;
  }
}

.bed-row__assign-icon {
  flex-shrink: 0;

  margin-right: 6px;

  opacity: 0.7;
}
</style>

<i18n lang="yaml" locale="en">
assign: 'Assign bed'
empty: 'Empty bed'
clear: 'Remove person from bed'
bedOf: 'Bed {position}: {name}'
emptyBed: 'Bed {position}: empty'
</i18n>

<i18n lang="yaml" locale="de">
assign: 'Bett zuweisen'
empty: 'Freies Bett'
clear: 'Person aus dem Bett entfernen'
bedOf: 'Bett {position}: {name}'
emptyBed: 'Bett {position}: frei'
</i18n>

<i18n lang="yaml" locale="fr">
assign: 'Attribuer le lit'
empty: 'Lit libre'
clear: 'Retirer la personne du lit'
bedOf: 'Lit {position} : {name}'
emptyBed: 'Lit {position} : libre'
</i18n>

<i18n lang="yaml" locale="pl">
assign: 'Przydziel łóżko'
empty: 'Wolne łóżko'
clear: 'Usuń osobę z łóżka'
bedOf: 'Łóżko {position}: {name}'
emptyBed: 'Łóżko {position}: wolne'
</i18n>

<i18n lang="yaml" locale="cs">
assign: 'Přiřadit lůžko'
empty: 'Volné lůžko'
clear: 'Odebrat osobu z lůžka'
bedOf: 'Lůžko {position}: {name}'
emptyBed: 'Lůžko {position}: volné'
</i18n>
