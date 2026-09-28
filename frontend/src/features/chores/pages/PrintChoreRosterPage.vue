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
        v-for="weekStart in data.weekStarts"
        :key="weekStart"
        class="print-sheet print-sheet--landscape roster-sheet"
      >
        <header class="roster-header">
          <div class="text-h6">{{ t('title') }}</div>
          <div>{{ to(data.eventName) }} · {{ range(weekStart) }}</div>
        </header>

        <chore-week-grid
          :chores="data.chores"
          :assignments="data.assignments"
          :week-start="weekStart"
          :names="names"
          print
        />

        <footer class="roster-footer text-caption">
          {{ t('legend') }}
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
import ChoreWeekGrid from '@/features/chores/components/ChoreWeekGrid.vue';
import type { PrintChoreRosterPayload } from '@/features/chores/components/printChoreRoster';

const { t, d } = useI18n();
const { to } = useObjectTranslation();

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

function range(weekStart: string): string {
  const start = parseLocalDate(weekStart);
  const end = parseLocalDate(addDays(weekStart, 6));
  return `${d(start, 'date')} – ${d(end, 'date')}`;
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
