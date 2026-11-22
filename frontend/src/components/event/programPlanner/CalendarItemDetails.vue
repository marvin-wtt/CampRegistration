<template>
  <div
    class="item-details"
    :class="`item-details--${variant}`"
    :style="{ '--item-color': item.color ?? DEFAULT_PROGRAM_ITEM_COLOR }"
    data-test="program-item-details"
  >
    <div class="item-details__header row no-wrap items-center">
      <span class="item-details__tile">
        <q-icon
          name="event_note"
          :size="variant === 'sheet' ? '28px' : '24px'"
        />
      </span>
      <div class="item-details__title col">
        {{ to(item.title) }}
      </div>
      <q-btn
        icon="close"
        :aria-label="t('action.close')"
        class="item-details__close self-start"
        flat
        round
        dense
        size="sm"
        @click="emit('close')"
      />
    </div>

    <div class="item-details__rows">
      <!-- When: date and time side by side -->
      <div class="item-details__row item-details__when row no-wrap">
        <div class="item-details__cell row no-wrap col">
          <q-icon
            name="calendar_today"
            class="item-details__icon"
          />
          <div class="col">
            <div class="item-details__label">{{ t('label.date') }}</div>
            <div class="item-details__value">{{ dateText }}</div>
          </div>
        </div>
        <template v-if="timeCell">
          <div class="item-details__divider" />
          <div class="item-details__cell row no-wrap col">
            <q-icon
              name="schedule"
              class="item-details__icon"
            />
            <div class="col">
              <div class="item-details__label">{{ timeCell.label }}</div>
              <div class="item-details__value">{{ timeCell.value }}</div>
            </div>
          </div>
        </template>
      </div>

      <div
        v-if="item.location"
        class="item-details__row row no-wrap items-center"
      >
        <q-icon
          name="place"
          class="item-details__icon"
        />
        <span class="item-details__label item-details__label--inline">
          {{ t('label.location') }}
        </span>
        <span class="item-details__value col">{{ to(item.location) }}</span>
      </div>

      <div class="item-details__row row no-wrap items-center">
        <q-icon
          name="layers"
          class="item-details__icon"
        />
        <span class="item-details__label item-details__label--inline">
          {{ t('label.plan') }}
        </span>
        <span class="col row no-wrap">
          <q-chip
            v-for="plan in plans"
            :key="plan"
            :label="plan.toUpperCase()"
            color="secondary-container"
            text-color="on-secondary-container"
            class="item-details__plan-chip"
            dense
          />
        </span>
      </div>

      <div
        v-if="item.details"
        class="item-details__row row no-wrap"
      >
        <q-icon
          name="description"
          class="item-details__icon"
        />
        <div class="col">
          <div class="item-details__label">{{ t('label.details') }}</div>
          <div class="item-details__notes">{{ to(item.details) }}</div>
        </div>
      </div>
    </div>

    <!-- Pinned to the bottom, so long details scroll beneath the actions -->
    <div
      v-if="primaryAction || plannerLink"
      class="item-details__actions column"
    >
      <q-btn
        v-if="primaryAction"
        :icon="primaryAction.icon"
        :label="primaryAction.label"
        :data-test="`program-item-${primaryAction.name}`"
        color="primary"
        text-color="on-primary"
        unelevated
        rounded
        no-caps
        class="item-details__primary full-width"
        @click="emit(primaryAction.name)"
      />
      <div
        v-if="secondaryActions.length"
        class="item-details__secondary row no-wrap"
      >
        <q-btn
          v-for="action in secondaryActions"
          :key="action.name"
          :icon="action.icon"
          :label="action.label"
          :data-test="`program-item-${action.name}`"
          :color="
            action.name === 'delete' ? 'error-container' : 'secondary-container'
          "
          :text-color="
            action.name === 'delete'
              ? 'on-error-container'
              : 'on-secondary-container'
          "
          unelevated
          stack
          no-caps
          class="item-details__secondary-btn col"
          @click="emit(action.name)"
        />
      </div>
      <m-btn
        v-if="plannerLink"
        :label="t('action.openPlanner')"
        :to="plannerLink"
        icon-right="chevron_right"
        primary
        tonal
        no-caps
        class="full-width"
        @click="emit('close')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ProgramItem } from '@camp-registration/common/entities';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMinutesAsTime, parseTimeToMinutes } from '@/utils/date';
import {
  DEFAULT_PROGRAM_ITEM_COLOR,
  formatProgramItemDuration,
} from '@/utils/programItem';

type ActionName =
  'schedule' | 'edit' | 'move-to-backlog' | 'duplicate' | 'delete';

interface Action {
  name: ActionName;
  icon: string;
  label: string;
}

const { locale, t } = useI18n();
const { to } = useObjectTranslation();

const {
  item,
  variant,
  editable = false,
  deletable = false,
  creatable = false,
  plannerLink,
} = defineProps<{
  item: ProgramItem;
  variant: 'popover' | 'sheet';
  editable?: boolean;
  deletable?: boolean;
  creatable?: boolean;
  plannerLink?: RouteLocationRaw | undefined;
}>();

const emit = defineEmits<{
  (e: ActionName | 'close'): void;
}>();

// In order of how likely each is the next step
const actions = computed<Action[]>(() => {
  const list: Action[] = [];
  if (editable && !item.date) {
    list.push({ name: 'schedule', icon: 'event', label: t('action.schedule') });
  }
  if (editable) {
    list.push({ name: 'edit', icon: 'edit', label: t('action.edit') });
  }
  if (editable && item.date) {
    list.push({
      name: 'move-to-backlog',
      icon: 'event_busy',
      label: t('action.moveToBacklog'),
    });
  }
  if (creatable) {
    list.push({
      name: 'duplicate',
      icon: 'content_copy',
      label: t('action.duplicate'),
    });
  }
  if (deletable) {
    list.push({ name: 'delete', icon: 'delete', label: t('action.delete') });
  }
  return list;
});

const primaryAction = computed<Action | undefined>(() => actions.value[0]);
const secondaryActions = computed<Action[]>(() => actions.value.slice(1));

// One chip per plan the item takes place in
const plans = computed<('a' | 'b')[]>(() =>
  item.plan === 'both' ? ['a', 'b'] : [item.plan],
);

const dateText = computed<string>(() => {
  if (!item.date) {
    return t('unscheduled');
  }
  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${item.date}T00:00`));
});

// The time range when there is one, else the duration or "all day"
const timeCell = computed<{ label: string; value: string } | null>(() => {
  const start = item.time ? parseTimeToMinutes(item.time) : null;
  if (start !== null) {
    const end = start + (item.duration ?? 60);
    return {
      label: t('label.time'),
      value: `${formatMinutesAsTime(start)} – ${formatMinutesAsTime(end)}`,
    };
  }
  if (item.duration) {
    return {
      label: t('label.duration'),
      value: formatProgramItemDuration(item.duration, locale.value),
    };
  }
  return item.date ? { label: t('label.time'), value: t('allDay') } : null;
});
</script>

<style lang="scss" scoped>
.item-details {
  --details-bg: var(--md3-surface-container-low);

  color: var(--md3-on-surface);

  &--popover {
    --details-bg: var(--md3-surface-container-high);

    width: min(400px, 92vw);
    padding: 16px 16px 0;
  }

  &--sheet {
    padding: 4px 20px 0;
  }

  &__header {
    gap: 14px;
  }

  // The item's color as a tinted tile, like an app icon
  &__tile {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--item-color) 22%, transparent);
    color: var(--item-color);
  }

  &--sheet &__tile {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  &--sheet &__title {
    font-size: 22px;
  }

  &__close {
    background: var(--md3-surface-container-highest);
    color: var(--md3-on-surface-variant);
  }

  &__rows {
    margin-top: 12px;
  }

  &__row {
    gap: 14px;
    padding: 12px 0;

    & + & {
      border-top: 1px solid var(--md3-outline-variant);
    }
  }

  &__cell {
    gap: 14px;
    min-width: 0;
  }

  &__divider {
    flex: none;
    width: 1px;
    align-self: stretch;
    background: var(--md3-outline-variant);
  }

  &__icon {
    flex: none;
    font-size: 22px;
    color: var(--md3-on-surface-variant);
  }

  &__label {
    font-size: 12px;
    color: var(--md3-on-surface-variant);

    &--inline {
      flex: none;
      min-width: 48px;
      font-size: 14px;
    }
  }

  &__value {
    font-size: 15px;
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  &__notes {
    margin-top: 2px;
    font-size: 14px;
    line-height: 1.45;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  // Quasar's chip content stretches full width and left-aligns its label
  &__plan-chip {
    min-width: 28px;
    padding: 0;
    font-weight: 600;

    :deep(.q-chip__content) {
      justify-content: center;
    }
  }

  &__actions {
    position: sticky;
    bottom: 0;
    gap: 8px;
    margin: 0 -4px;
    padding: 12px 4px max(16px, env(safe-area-inset-bottom));
    background: var(--details-bg);
  }

  &__primary {
    min-height: 48px;
    font-size: 15px;
  }

  &__secondary {
    gap: 8px;
  }
}

// Icon above the label, so three fit side by side on a phone. Nested to beat
// the theme's `.q-btn:not(.q-btn--dense)…` min-height.
.item-details .item-details__secondary .item-details__secondary-btn {
  height: auto;
  min-height: 60px;
  padding: 8px 4px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.2;
}
</style>
<i18n lang="yaml" locale="en">
unscheduled: 'Not scheduled yet'
allDay: 'All day'
label:
  date: 'Date'
  time: 'Time'
  duration: 'Duration'
  location: 'Location'
  plan: 'Plan'
  details: 'Details'
action:
  schedule: 'Schedule'
  moveToBacklog: 'Unschedule'
  duplicate: 'Duplicate'
  edit: 'Edit'
  delete: 'Delete'
  close: 'Close'
  openPlanner: 'Open in planner'
</i18n>

<i18n lang="yaml" locale="de">
unscheduled: 'Noch nicht eingeplant'
allDay: 'Ganztägig'
label:
  date: 'Datum'
  time: 'Uhrzeit'
  duration: 'Dauer'
  location: 'Ort'
  plan: 'Plan'
  details: 'Details'
action:
  schedule: 'Einplanen'
  moveToBacklog: 'Ausplanen'
  duplicate: 'Duplizieren'
  edit: 'Bearbeiten'
  delete: 'Löschen'
  close: 'Schließen'
  openPlanner: 'Im Planer öffnen'
</i18n>

<i18n lang="yaml" locale="fr">
unscheduled: 'Pas encore planifié'
allDay: 'Toute la journée'
label:
  date: 'Date'
  time: 'Heure'
  duration: 'Durée'
  location: 'Lieu'
  plan: 'Plan'
  details: 'Détails'
action:
  schedule: 'Planifier'
  moveToBacklog: 'Retirer'
  duplicate: 'Dupliquer'
  edit: 'Modifier'
  delete: 'Supprimer'
  close: 'Fermer'
  openPlanner: 'Ouvrir dans le planificateur'
</i18n>

<i18n lang="yaml" locale="pl">
unscheduled: 'Jeszcze niezaplanowane'
allDay: 'Cały dzień'
label:
  date: 'Data'
  time: 'Godzina'
  duration: 'Czas trwania'
  location: 'Miejsce'
  plan: 'Plan'
  details: 'Szczegóły'
action:
  schedule: 'Zaplanuj'
  moveToBacklog: 'Wycofaj'
  duplicate: 'Duplikuj'
  edit: 'Edytuj'
  delete: 'Usuń'
  close: 'Zamknij'
  openPlanner: 'Otwórz w planerze'
</i18n>

<i18n lang="yaml" locale="cs">
unscheduled: 'Zatím nenaplánováno'
allDay: 'Celý den'
label:
  date: 'Datum'
  time: 'Čas'
  duration: 'Doba trvání'
  location: 'Místo'
  plan: 'Plán'
  details: 'Podrobnosti'
action:
  schedule: 'Naplánovat'
  moveToBacklog: 'Vyřadit'
  duplicate: 'Duplikovat'
  edit: 'Upravit'
  delete: 'Smazat'
  close: 'Zavřít'
  openPlanner: 'Otevřít v plánovači'
</i18n>
