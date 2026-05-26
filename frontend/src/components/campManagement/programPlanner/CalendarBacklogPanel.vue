<template>
  <!-- Mobile: fixed FAB + bottom-sheet dialog -->
  <template v-if="quasar.screen.xs">
    <q-btn
      class="backlog-fab"
      round
      size="md"
      color="white"
      text-color="primary"
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

    <q-dialog
      v-model="mobileOpen"
      position="bottom"
    >
      <q-card style="width: 100%">
        <q-card-section class="row items-center">
          <span class="text-h6">{{ t('title') }}</span>
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
            @click="onMobileAdd"
          >
            <q-tooltip>{{ t('add') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
          />
        </q-card-section>

        <q-separator />

        <q-scroll-area style="height: min(50vh, 400px)">
          <div class="q-pa-md column q-gutter-y-sm">
            <div
              v-if="!filteredEvents.length"
              class="text-body2 text-grey text-center q-pa-lg"
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
                color="grey-6"
                class="q-mt-xs"
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
        </q-scroll-area>
      </q-card>
    </q-dialog>
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
        class="text-caption text-grey text-center q-pa-md"
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
          color="grey-6"
          class="q-mt-xs"
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

// Desktop sidebar
.backlog {
  display: flex;
  flex-direction: column;
  // flex: 0 0 <size> prevents grow/shrink so re-expanding never outgrows the layout
  flex: 0 0 220px;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  transition: flex-basis 0.2s ease;
  overflow: hidden;

  &--collapsed {
    flex: 0 0 36px;
  }

  &--dragover {
    background: rgba(33, 150, 243, 0.06);
    box-shadow: inset 0 0 0 2px rgba(33, 150, 243, 0.5);
  }

  .body--dark & {
    border-left-color: rgba(255, 255, 255, 0.12);
  }
}

.backlog__head {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  user-select: none;
  min-height: 36px;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .body--dark & {
    border-bottom-color: rgba(255, 255, 255, 0.08);

    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }
  }
}

.backlog__head-label {
  white-space: nowrap;
}

.backlog__body {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.backlog-card {
  position: relative;
  padding: 6px 8px;
  border-left: 3px solid #9e9e9e;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.03);
  cursor: grab;
  min-width: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  &:active {
    cursor: grabbing;
  }

  .body--dark & {
    background: rgba(255, 255, 255, 0.04);

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

.backlog-card__title {
  word-break: break-word;
  line-height: 1.3;
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
