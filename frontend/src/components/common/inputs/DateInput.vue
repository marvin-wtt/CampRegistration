<template>
  <!-- A field, not a readonly input: that would render a dashed border. -->
  <q-field
    :model-value="model"
    :label
    :clearable
    stack-label
    outlined
    rounded
    hide-bottom-space
    class="cursor-pointer"
    @clear="model = null"
  >
    <template #prepend>
      <q-icon name="calendar_month" />
    </template>
    <template #control>
      <div class="self-center full-width no-outline">
        {{ model ? d(parseLocalDate(model), 'date') : '' }}
      </div>
    </template>
    <!-- The calendar is the only surface: the menu around it is invisible,
         or its own padding and size frame the calendar. -->
    <q-popup-proxy
      anchor="bottom left"
      self="top left"
      class="date-input-popup"
      transition-show="scale"
      transition-hide="scale"
    >
      <!-- The event's days carry a dot; other days stay selectable. -->
      <!-- Our own header: Quasar's ignores the app locale's date format. -->
      <q-date
        v-model="model"
        class="rounded-xl elevation-2"
        mask="YYYY-MM-DD"
        :options="dateOptions"
        :events="isEventDay"
        event-color="primary"
        :default-year-month="defaultYearMonth"
        :title="headerTitle"
        :subtitle="headerSubtitle"
        @navigation="onNavigation"
      >
        <div class="row items-center justify-between no-wrap">
          <div
            v-if="markersInView"
            class="legend row items-center no-wrap text-caption"
          >
            <span class="legend-dot" />
            {{ t('eventDays') }}
          </div>
          <q-space />
          <q-btn
            v-close-popup
            :label="t('close')"
            color="primary"
            flat
            rounded
          />
        </div>
      </q-date>
    </q-popup-proxy>
  </q-field>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { formatLocalDate, parseLocalDate } from '@/utils/date';

// The app's date field: the MD3 date picker in a popup, `YYYY-MM-DD` in and
// out, shown in the locale's numeric format. Inside an event it marks the
// event's days and opens on its month.
const props = defineProps<{
  label: string;
  clearable?: boolean;
  // Inclusive `YYYY-MM-DD` bounds.
  min?: string | undefined;
  max?: string | undefined;
}>();

const model = defineModel<string | null>({ required: true });

const { t, d, locale } = useI18n();
const eventDetailsStore = useEventDetailsStore();

const eventStart = computed(() => eventDetailsStore.data?.startAt.slice(0, 10));
const eventEnd = computed(() => eventDetailsStore.data?.endAt.slice(0, 10));

// QDate passes dates as `YYYY/MM/DD`.
function toIso(value: string): string {
  return value.replaceAll('/', '-');
}

function dateOptions(value: string): boolean {
  const date = toIso(value);
  return (!props.min || date >= props.min) && (!props.max || date <= props.max);
}

function isEventDay(value: string): boolean {
  const date = toIso(value);
  return (
    !!eventStart.value &&
    !!eventEnd.value &&
    date >= eventStart.value &&
    date <= eventEnd.value
  );
}

// The month the picker shows, `YYYY-MM`: where it opens, then as browsed.
const viewedMonth = ref<string | null>(null);

function onNavigation({ year, month }: { year: number; month: number }) {
  viewedMonth.value = `${year}-${String(month).padStart(2, '0')}`;
}

function openingMonth(): string {
  return (
    model.value?.slice(0, 7) ??
    eventStart.value?.slice(0, 7) ??
    formatLocalDate(new Date()).slice(0, 7)
  );
}

// The legend explains the dots, so it only shows with dots on screen.
const markersInView = computed<boolean>(() => {
  const month = viewedMonth.value ?? openingMonth();
  return (
    !!eventStart.value &&
    !!eventEnd.value &&
    eventStart.value.slice(0, 7) <= month &&
    eventEnd.value.slice(0, 7) >= month
  );
});

const headerTitle = computed<string>(() =>
  model.value ? d(parseLocalDate(model.value), 'date') : t('none'),
);

const headerSubtitle = computed<string>(() =>
  model.value
    ? parseLocalDate(model.value).toLocaleDateString(locale.value, {
        weekday: 'long',
      })
    : ' ',
);

// An empty field opens on the event's month rather than today's.
const defaultYearMonth = computed<string | undefined>(() =>
  eventStart.value?.slice(0, 7).replace('-', '/'),
);
</script>

<style scoped>
.legend {
  gap: 6px;
  color: var(--md3-on-surface-variant);
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--md3-primary);
}
</style>

<!-- Unscoped: the menu is teleported out of this component. -->
<style>
/* Two classes, so the theme's own `.q-menu` surface can't win by order. */
.q-menu.date-input-popup {
  padding: 0;
  overflow: visible;
  background: transparent;
  box-shadow: none;
}
</style>

<i18n lang="yaml" locale="en">
close: 'Close'
eventDays: 'Event days'
none: 'No date'
</i18n>

<i18n lang="yaml" locale="de">
close: 'Schließen'
eventDays: 'Veranstaltungstage'
none: 'Kein Datum'
</i18n>

<i18n lang="yaml" locale="fr">
close: 'Fermer'
eventDays: 'Jours de l’événement'
none: 'Aucune date'
</i18n>

<i18n lang="yaml" locale="pl">
close: 'Zamknij'
eventDays: 'Dni wydarzenia'
none: 'Brak daty'
</i18n>

<i18n lang="yaml" locale="cs">
close: 'Zavřít'
eventDays: 'Dny akce'
none: 'Bez data'
</i18n>
