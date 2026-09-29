<template>
  <q-page class="print-page">
    <div
      v-if="error"
      class="q-pa-md"
    >
      <q-banner
        rounded
        class="bg-negative text-white"
      >
        {{ error }}
      </q-banner>
    </div>

    <template v-else-if="data">
      <div
        v-for="page in data.pages"
        :key="page.start"
        class="print-sheet print-sheet--landscape roster-sheet"
      >
        <header class="roster-header">
          <div class="text-h6">{{ label('title') }}</div>
          <div>{{ toAll(data.eventName) }} · {{ range(page) }}</div>
        </header>

        <chore-week-grid
          :chores="data.chores"
          :assignments="data.assignments"
          :week-start="page.start"
          :day-count="page.days"
          :names="names"
          :locales="locales"
          print
        />

        <footer class="roster-footer text-caption">
          {{ label('legend') }}
        </footer>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePrintPage, waitForStableLayout } from '@/composables/printPage';
import { addDays, parseLocalDate } from '@/utils/date';
import {
  cssString,
  PAGE_COUNTER,
  pageRule,
  usePageStyle,
} from '@/utils/printMarginBoxes';
import ChoreWeekGrid from '@/components/event/chorePlanner/ChoreWeekGrid.vue';
import type {
  PrintChoreRosterPage,
  PrintChoreRosterPayload,
} from '@/components/event/chorePlanner/printChoreRoster';

const { t, d, locale } = useI18n();
const { toAll } = useObjectTranslation();

const { payload: data, error } = usePrintPage<PrintChoreRosterPayload>({
  messagePrefix: 'PRINT_CHORES',
  prepare: () => waitForStableLayout(),
});

usePageStyle(
  computed<string>(() =>
    pageRule({
      'bottom-center': cssString(d(new Date(), 'dateTime')),
      'bottom-right': PAGE_COUNTER,
    }),
  ),
);

const names = computed(() => new Map(data.value?.names ?? []));

// Printed for everyone at the event, so in all its languages.
const locales = computed<string[]>(() =>
  data.value?.locales.length ? data.value.locales : [locale.value],
);

function label(key: string): string {
  return [...new Set(locales.value.map((l) => t(key, {}, { locale: l })))].join(
    ' / ',
  );
}

function range(page: PrintChoreRosterPage): string {
  const primary = locales.value[0] ?? locale.value;
  const start = parseLocalDate(page.start);
  const end = parseLocalDate(addDays(page.start, page.days - 1));
  // Numeric, so no month name needs translating on a multilingual roster.
  return `${d(start, 'short', primary)} – ${d(end, 'short', primary)}`;
}
</script>

<style scoped>
.roster-sheet {
  padding: 0;
  break-after: page;
}

.roster-sheet:last-child {
  break-after: auto;
}

.roster-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.roster-footer {
  margin-top: 8px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Duty roster'
legend: 'Names in italics supervise the duty.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienstplan'
legend: 'Kursiv gesetzte Namen haben die Aufsicht.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Plan des corvées'
legend: 'Les noms en italique encadrent la corvée.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Grafik dyżurów'
legend: 'Imiona kursywą oznaczają opiekunów dyżuru.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Rozpis služeb'
legend: 'Jména kurzívou mají na službu dozor.'
</i18n>
