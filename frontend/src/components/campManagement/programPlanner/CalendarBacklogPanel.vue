<template>
  <!-- Mobile: fixed FAB + bottom sheet -->
  <template v-if="quasar.screen.xs">
    <q-btn
      class="backlog-fab"
      round
      size="md"
      icon="inbox"
      @click="mobileOpen = true"
    >
      <q-badge
        v-if="filteredEvents.length"
        :label="filteredEvents.length"
        color="primary"
        floating
      />
    </q-btn>

    <bottom-sheet v-model="mobileOpen">
      <div class="row items-center q-mb-sm">
        <span class="text-subtitle1 text-weight-medium">{{ t('title') }}</span>
        <q-badge
          v-if="filteredEvents.length"
          :label="filteredEvents.length"
          color="primary"
          class="q-ml-sm"
        />
        <q-space />
        <q-btn
          icon="add"
          flat
          round
          dense
          @click="onMobileAdd"
        >
          <q-tooltip>{{ t('add') }}</q-tooltip>
        </q-btn>
      </div>

      <div class="column q-gutter-y-sm">
        <div
          v-if="!filteredEvents.length"
          class="backlog__empty text-body2 text-center q-pa-lg"
        >
          {{ t('empty') }}
        </div>
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="backlog-card"
          :style="{ borderLeftColor: event.color ?? '#9E9E9E' }"
        >
          <div class="backlog-card__title text-body2">
            {{ showAllTranslations ? toAll(event.title) : to(event.title) }}
          </div>
          <q-icon
            v-if="event.plan !== 'both'"
            :name="event.plan === 'a' ? 'wb_sunny' : 'water_drop'"
            size="14px"
            class="backlog-card__plan-icon q-mt-xs"
          />
          <calendar-item-popup
            :event="event"
            @edit="emit('edit', event)"
            @delete="emit('delete', event)"
            @duplicate="emit('duplicate', event)"
            @schedule="onMobileSchedule(event)"
          />
        </div>
      </div>
    </bottom-sheet>
  </template>

  <!-- Desktop: collapsible sidebar -->
  <div
    v-else
    class="backlog"
    :class="[
      { 'backlog--collapsed': collapsed },
      { 'backlog--dragover': isDragOver },
    ]"
    @dragover.prevent
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Header / collapse toggle -->
    <div
      class="backlog__head"
      @click="collapsed = !collapsed"
    >
      <q-icon
        name="inbox"
        size="20px"
      />
      <span
        v-if="!collapsed"
        class="backlog__head-label text-body2 text-weight-medium q-ml-xs"
      >
        {{ t('title') }}
      </span>
      <q-badge
        v-if="filteredEvents.length"
        :label="filteredEvents.length"
        color="primary"
        class="q-ml-xs"
      />
      <q-space v-if="!collapsed" />
      <q-btn
        v-if="!collapsed"
        icon="add"
        flat
        round
        dense
        size="sm"
        @click.stop="emit('add')"
      >
        <q-tooltip>{{ t('add') }}</q-tooltip>
      </q-btn>
      <q-icon
        :name="collapsed ? 'chevron_left' : 'chevron_right'"
        size="16px"
        class="q-ml-xs"
      />
    </div>

    <!-- Event list -->
    <div
      v-if="!collapsed"
      class="backlog__body"
    >
      <div
        v-if="!filteredEvents.length"
        class="backlog__empty text-caption text-center q-pa-md"
      >
        {{ t('empty') }}
      </div>
      <div
        v-for="event in filteredEvents"
        :key="event.id"
        class="backlog-card"
        :style="{ borderLeftColor: event.color ?? '#9E9E9E' }"
        draggable="true"
        @dragstart="(e) => onCardDragStart(e, event)"
      >
        <div class="backlog-card__title text-caption">
          {{ showAllTranslations ? toAll(event.title) : to(event.title) }}
        </div>
        <q-icon
          v-if="event.plan !== 'both'"
          :name="event.plan === 'a' ? 'wb_sunny' : 'water_drop'"
          size="10px"
          class="backlog-card__plan-icon q-mt-xs"
        />
        <calendar-item-popup
          :event="event"
          @edit="emit('edit', event)"
          @delete="emit('delete', event)"
          @duplicate="emit('duplicate', event)"
          @schedule="emit('schedule', event)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import CalendarItemPopup from 'components/campManagement/programPlanner/CalendarItemPopup.vue';
import BottomSheet from 'components/BottomSheet.vue';

const { t } = useI18n();
const quasar = useQuasar();
const { to, toAll } = useObjectTranslation();

const {
  events,
  activePlan,
  showAllTranslations = false,
} = defineProps<{
  events: ProgramEvent[];
  activePlan: 'a' | 'b' | 'both';
  showAllTranslations?: boolean;
}>();

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'edit', event: ProgramEvent): void;
  (e: 'delete', event: ProgramEvent): void;
  (e: 'duplicate', event: ProgramEvent): void;
  (e: 'schedule', event: ProgramEvent): void;
  (e: 'dragstart', nativeEvent: DragEvent, event: ProgramEvent): void;
  (e: 'move-to-backlog', id: string): void;
}>();

const collapsed = ref(false);
const mobileOpen = ref(false);
let dragCounter = 0;
const isDragOver = ref(false);

const filteredEvents = computed<ProgramEvent[]>(() => {
  if (activePlan === 'both') {
    return events;
  }
  return events.filter((e) => e.plan === activePlan || e.plan === 'both');
});

function onMobileAdd() {
  emit('add');
}

function onMobileSchedule(event: ProgramEvent) {
  mobileOpen.value = false;
  emit('schedule', event);
}

function onCardDragStart(e: DragEvent, event: ProgramEvent) {
  if (!e.dataTransfer) {
    return;
  }
  e.dataTransfer.effectAllowed = 'copyMove';
  e.dataTransfer.setData('text/plain', event.id);
  emit('dragstart', e, event);
}

function onDragEnter() {
  dragCounter++;
  isDragOver.value = true;
}

function onDragLeave() {
  if (--dragCounter === 0) {
    isDragOver.value = false;
  }
}

function onDrop(e: DragEvent) {
  dragCounter = 0;
  isDragOver.value = false;
  const id = e.dataTransfer?.getData('text/plain');
  if (id) {
    emit('move-to-backlog', id);
  }
}
</script>

<style lang="scss" scoped>
// Mobile FAB — fixed bottom-right, escapes flex layout entirely
.backlog-fab {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 100;

  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 4px 8px 3px rgba(0, 0, 0, 0.15);
}

// Desktop sidebar
.backlog {
  display: flex;
  flex-direction: column;
  // flex: 0 0 <size> prevents grow/shrink so re-expanding never outgrows the layout
  flex: 0 0 228px;
  border-left: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-low);
  transition:
    flex-basis 0.25s cubic-bezier(0.2, 0, 0, 1),
    background 0.15s;
  overflow: hidden;

  &--collapsed {
    flex: 0 0 40px;
  }

  &--dragover {
    background: color-mix(
      in srgb,
      var(--md3-primary) 8%,
      var(--md3-surface-container-low)
    );
    box-shadow: inset 0 0 0 2px var(--md3-primary);
  }
}

.backlog__head {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid var(--md3-outline-variant);
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
  user-select: none;
  min-height: 40px;

  &:hover {
    background: color-mix(in srgb, var(--md3-on-surface) 8%, transparent);
  }
}

.backlog__head-label {
  white-space: nowrap;
  color: var(--md3-on-surface);
}

.backlog__empty {
  color: var(--md3-on-surface-variant);
}

.backlog__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.backlog-card {
  position: relative;
  padding: 8px 10px;
  border: 1px solid var(--md3-outline-variant);
  border-left: 4px solid #9e9e9e;
  border-radius: 10px;
  background: var(--md3-surface);
  color: var(--md3-on-surface);
  cursor: grab;
  min-width: 0;
  transition:
    background 0.15s,
    box-shadow 0.15s;

  &:hover {
    background: var(--md3-surface-container);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  &:active {
    cursor: grabbing;
  }
}

.backlog-card__title {
  word-break: break-word;
  line-height: 1.3;
}

.backlog-card__plan-icon {
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Unscheduled'
add: 'Add unscheduled event'
empty: 'No unscheduled events'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Ungeplant'
add: 'Ungeplantes Ereignis hinzufügen'
empty: 'Keine ungeplanten Ereignisse'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Non planifié'
add: 'Ajouter un événement non planifié'
empty: 'Aucun événement non planifié'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Niezaplanowane'
add: 'Dodaj niezaplanowane wydarzenie'
empty: 'Brak niezaplanowanych wydarzeń'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Neplánované'
add: 'Přidat neplánovanou událost'
empty: 'Žádné neplánované události'
</i18n>
