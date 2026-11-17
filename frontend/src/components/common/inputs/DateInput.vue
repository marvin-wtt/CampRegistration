<template>
  <!-- The shared date field, a q-date popup with numeric dates. A field, not a
       readonly input: that would render a dashed border. -->
  <q-field
    :model-value="model"
    :label
    :hint
    :clearable
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
      <!-- Highlighted days carry a dot; other days stay selectable. -->
      <q-date
        v-model="model"
        mask="YYYY-MM-DD"
        :options="dateOptions"
        :events="isHighlighted"
        event-color="primary"
        :default-year-month="defaultYearMonth"
        :navigation-min-year-month="toYearMonth(min)"
        :navigation-max-year-month="toYearMonth(max)"
      >
        <div class="row items-center justify-between no-wrap">
          <div
            v-if="highlight && highlightLabel"
            class="legend row items-center no-wrap text-caption"
          >
            <span class="legend-dot" />
            {{ highlightLabel }}
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
import { formatLocalDate, parseLocalDate } from '@/utils/date';

const props = defineProps<{
  label: string;
  hint?: string | undefined;
  clearable?: boolean;
  // Inclusive `YYYY-MM-DD` bounds.
  min?: string | undefined;
  max?: string | undefined;
  /** Open an empty field on today's month, e.g. for when money moved. */
  openOnToday?: boolean;
  /** Inclusive `YYYY-MM-DD` days marked with a dot, e.g. an event's. */
  highlight?: { start: string; end: string } | undefined;
  /** Names the marked days below the calendar. */
  highlightLabel?: string | undefined;
}>();

const model = defineModel<string | null | undefined>();

const { t, d } = useI18n();

function toYearMonth(date: string | undefined): string | undefined {
  return date?.slice(0, 7).replace('-', '/');
}

// QDate passes dates as `YYYY/MM/DD`.
function toIso(value: string): string {
  return value.replaceAll('/', '-');
}

function dateOptions(value: string): boolean {
  const date = toIso(value);
  return (!props.min || date >= props.min) && (!props.max || date <= props.max);
}

function isHighlighted(value: string): boolean {
  const date = toIso(value);
  return (
    !!props.highlight &&
    date >= props.highlight.start &&
    date <= props.highlight.end
  );
}

// An empty field opens on the marked days' month rather than today's.
const defaultYearMonth = computed<string | undefined>(() =>
  toYearMonth(
    props.openOnToday ? formatLocalDate(new Date()) : props.highlight?.start,
  ),
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
</i18n>

<i18n lang="yaml" locale="de">
close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
close: 'Zavřít'
</i18n>
