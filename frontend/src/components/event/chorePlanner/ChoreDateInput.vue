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
    <q-popup-proxy
      cover
      transition-show="scale"
      transition-hide="scale"
    >
      <!-- The event's days carry a dot; other days stay selectable. -->
      <q-date
        v-model="model"
        mask="YYYY-MM-DD"
        :options="dateOptions"
        :events="isEventDay"
        event-color="primary"
        :default-year-month="defaultYearMonth"
      >
        <div class="row items-center justify-between no-wrap">
          <div
            v-if="eventStart"
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { parseLocalDate } from '@/utils/date';

const props = defineProps<{
  label: string;
  clearable?: boolean;
  // Inclusive `YYYY-MM-DD` bounds.
  min?: string | undefined;
  max?: string | undefined;
}>();

const model = defineModel<string | null>({ required: true });

const { t, d } = useI18n();
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

<i18n lang="yaml" locale="en">
close: 'Close'
eventDays: 'Event days'
</i18n>

<i18n lang="yaml" locale="de">
close: 'Schließen'
eventDays: 'Veranstaltungstage'
</i18n>

<i18n lang="yaml" locale="fr">
close: 'Fermer'
eventDays: 'Jours de l’événement'
</i18n>

<i18n lang="yaml" locale="pl">
close: 'Zamknij'
eventDays: 'Dni wydarzenia'
</i18n>

<i18n lang="yaml" locale="cs">
close: 'Zavřít'
eventDays: 'Dny akce'
</i18n>
