<template>
  <q-card
    flat
    bordered
    class="program-card"
  >
    <q-card-section>
      <dashboard-card-header
        icon="calendar_month"
        :title="isToday ? t('title.today') : t('title.day', { day: day.day })"
        :link="{
          label: t('program.open'),
          to: { name: 'management.event.program-planner' },
        }"
        :caption="caption"
      />
    </q-card-section>

    <q-card-section
      v-if="!programLoading && hasAlternatives"
      class="plan-bar"
    >
      <q-btn-toggle
        v-model="shownPlan"
        :options="planOptions"
        dense
        no-caps
        toggle-color="primary"
        data-test="dashboard-program-plan"
      />
      <span
        v-if="publicationText"
        class="plan-publication"
      >
        <q-icon
          :name="publishedPlan === null ? 'public_off' : 'public'"
          size="16px"
        />
        {{ publicationText }}
      </span>
    </q-card-section>

    <q-card-section class="today-section">
      <template v-if="programLoading">
        <q-skeleton
          v-for="width in ['70%', '55%', '62%']"
          :key="width"
          type="text"
          :width="width"
        />
      </template>
      <div
        v-else-if="rows.length === 0"
        class="empty-text"
      >
        {{ t('program.empty') }}
      </div>
      <template v-else>
        <m-btn
          v-if="earlierRows.length > 0"
          :label="
            showEarlier
              ? t('program.hideEarlier')
              : t('program.showEarlier', earlierRows.length)
          "
          :icon="showEarlier ? 'expand_less' : 'expand_more'"
          size="sm"
          primary
          text
          no-caps
          class="earlier-toggle"
          @click="showEarlier = !showEarlier"
        />
        <ol class="program-list">
          <li
            v-for="row in visibleRows"
            :key="row.id"
            class="program-item"
            :class="`program-item--${row.state}`"
            :style="row.color ? { '--item-color': row.color } : undefined"
          >
            <span class="program-time">
              <template v-if="row.start">
                <span>{{ row.start }}</span>
                <span
                  v-if="row.end"
                  class="program-end"
                >
                  {{ row.end }}
                </span>
              </template>
              <template v-else>{{ t('program.allDay') }}</template>
            </span>
            <span class="program-text">
              <span class="program-title">
                {{ row.title }}
                <span
                  v-if="row.state === 'now'"
                  class="state-badge state-badge--now"
                >
                  {{ t('program.now') }}
                </span>
                <span
                  v-else-if="
                    row.id === nextRow?.id && nextRow.startsIn !== null
                  "
                  class="state-badge"
                >
                  {{ t('program.startsIn', nextRow.startsIn) }}
                </span>
              </span>
              <span
                v-if="row.location"
                class="program-location"
              >
                <q-icon
                  name="place"
                  size="14px"
                />
                {{ row.location }}
              </span>
            </span>
          </li>
        </ol>
        <m-btn
          v-if="laterRows.length > 0"
          :label="
            showLater
              ? t('program.hideLater')
              : t('program.showLater', laterRows.length)
          "
          :icon="showLater ? 'expand_less' : 'expand_more'"
          size="sm"
          primary
          text
          no-caps
          class="later-toggle"
          @click="showLater = !showLater"
        />
        <div
          v-if="isToday && remainingCount === 0"
          class="empty-text"
        >
          {{ t('program.dayDone') }}
        </div>
      </template>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Event, ProgramItem } from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import { useProgramPlannerStore } from '@/stores/program-planner-store';
import { useProgramPublishedDayStore } from '@/stores/program-published-day-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useMinuteClock } from '@/composables/minuteClock';
import { eventDayOf, shownEventDate } from '@/composables/eventPhase';
import {
  formatLocalDate,
  formatMinutesAsTime,
  parseLocalDate,
  parseTimeToMinutes,
} from '@/utils/date';

// The day's program at a glance: what runs now and what comes next, with past
// items folded away. Outside the event it shows the first day.
const { event } = defineProps<{
  event: Event;
}>();

type Plan = 'a' | 'b';
type RowState = 'past' | 'now' | 'upcoming';

interface Row {
  id: string;
  title: string;
  location: string | null;
  color: string | null;
  start: string | null;
  end: string | null;
  startMinutes: number | null;
  state: RowState;
}

// Items without a duration last until the next one starts, or this long.
const FALLBACK_DURATION = 60;
// "Starts in" only counts down for the next item within this window.
const COUNTDOWN_MINUTES = 120;
// Upcoming items shown before folding: next to what runs now, and otherwise.
const UPCOMING_WITH_CURRENT = 2;
const UPCOMING_WITHOUT_CURRENT = 3;

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const programStore = useProgramPlannerStore();
const publishedDayStore = useProgramPublishedDayStore();
const clock = useMinuteClock();

const date = computed<string>(() => shownEventDate(event));

const isToday = computed<boolean>(
  () => date.value === formatLocalDate(clock.value),
);

const day = computed(() => eventDayOf(event, date.value));

const caption = computed<string>(
  () => `${t('dayOf', day.value)} · ${d(parseLocalDate(date.value), 'date')}`,
);

const programLoading = computed<boolean>(() => programStore.isLoading);

const dayItems = computed<ProgramItem[]>(() =>
  (programStore.data ?? []).filter((item) => item.date === date.value),
);

const hasAlternatives = computed<boolean>(() =>
  dayItems.value.some((item) => item.plan !== 'both'),
);

const publishedPlan = computed(
  () =>
    publishedDayStore.data?.find((entry) => entry.date === date.value)?.plan ??
    null,
);

// Follows what participants see until the manager picks a plan here.
const chosenPlan = ref<Plan | null>(null);
const showEarlier = ref(false);
const showLater = ref(false);
watch(date, () => {
  chosenPlan.value = null;
  showEarlier.value = false;
  showLater.value = false;
});

const shownPlan = computed<Plan>({
  get: () => chosenPlan.value ?? (publishedPlan.value === 'b' ? 'b' : 'a'),
  set: (plan) => {
    chosenPlan.value = plan;
  },
});

const planOptions = computed(() => [
  { label: t('plan.a'), value: 'a' },
  { label: t('plan.b'), value: 'b' },
]);

const publicationText = computed<string | null>(() => {
  if (publishedDayStore.data === undefined) {
    return null;
  }
  switch (publishedPlan.value) {
    case 'a':
      return t('publication.a');
    case 'b':
      return t('publication.b');
    case 'both':
      return t('publication.both');
    default:
      return t('publication.none');
  }
});

const rows = computed<Row[]>(() => {
  const items = dayItems.value.filter(
    (item) =>
      !hasAlternatives.value ||
      item.plan === 'both' ||
      item.plan === shownPlan.value,
  );
  const nowMinutes = clock.value.getHours() * 60 + clock.value.getMinutes();

  const timed = items
    .map((item) => ({
      item,
      start: item.time ? parseTimeToMinutes(item.time) : null,
    }))
    .sort((a, b) => (a.start ?? -1) - (b.start ?? -1));

  return timed.map(({ item, start }) => {
    const base = {
      id: item.id,
      title: to(item.title),
      location: item.location ? to(item.location) : null,
      color: item.color,
    };
    if (start === null) {
      return {
        ...base,
        start: null,
        end: null,
        startMinutes: null,
        state: 'upcoming',
      };
    }

    const nextStart = timed.find(
      (other) => other.start !== null && other.start > start,
    )?.start;
    const end =
      item.duration !== null
        ? start + item.duration
        : (nextStart ?? start + FALLBACK_DURATION);

    let state: RowState = 'upcoming';
    if (isToday.value && nowMinutes >= end) {
      state = 'past';
    } else if (isToday.value && nowMinutes >= start) {
      state = 'now';
    }

    return {
      ...base,
      start: formatMinutesAsTime(start),
      end: item.duration !== null ? formatMinutesAsTime(end) : null,
      startMinutes: start,
      state,
    };
  });
});

const earlierRows = computed<Row[]>(() =>
  rows.value.filter((row) => row.state === 'past'),
);

const laterRows = computed<Row[]>(() => {
  const limit = rows.value.some((row) => row.state === 'now')
    ? UPCOMING_WITH_CURRENT
    : UPCOMING_WITHOUT_CURRENT;
  return rows.value
    .filter((row) => row.startMinutes !== null && row.state === 'upcoming')
    .slice(limit);
});

const visibleRows = computed<Row[]>(() => {
  const later = new Set(laterRows.value.map((row) => row.id));
  return rows.value.filter(
    (row) =>
      (showEarlier.value || row.state !== 'past') &&
      (showLater.value || !later.has(row.id)),
  );
});

const remainingCount = computed<number>(
  () =>
    rows.value.filter(
      (row) => row.startMinutes !== null && row.state !== 'past',
    ).length,
);

const nextRow = computed(() => {
  const next = rows.value.find(
    (row) => row.startMinutes !== null && row.state === 'upcoming',
  );
  if (!next || next.startMinutes === null) {
    return null;
  }
  const nowMinutes = clock.value.getHours() * 60 + clock.value.getMinutes();
  const startsIn = next.startMinutes - nowMinutes;
  return {
    id: next.id,
    startsIn: isToday.value && startsIn <= COUNTDOWN_MINUTES ? startsIn : null,
  };
});
</script>

<style scoped>
.program-card {
  border-radius: 16px;
}

.today-section {
  padding-top: 0;
}

.plan-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding-top: 0;
}

.plan-publication {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

.earlier-toggle {
  margin: 0 0 4px -8px;
}

.later-toggle {
  margin: 4px 0 0 -8px;
}

.program-list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.program-item {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  gap: 12px;
  padding: 8px 10px 8px 9px;
  border-left: 3px solid var(--item-color, var(--md3-outline-variant));
  border-radius: 4px 10px 10px 4px;
}

.program-item--past {
  opacity: 0.6;
}

.program-item--now {
  background: var(--md3-primary-container);
}

.program-time {
  display: flex;
  flex-direction: column;
  color: var(--md3-on-surface-variant);
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.program-end {
  font-size: 0.75rem;
  font-weight: 400;
}

.program-item--now .program-time,
.program-item--now .program-title,
.program-item--now .program-location {
  color: var(--md3-on-primary-container);
}

.program-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.program-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  color: var(--md3-on-surface);
  font-size: 0.875rem;
  font-weight: 500;
}

.state-badge {
  padding: 0 8px;
  color: var(--md3-on-secondary-container);
  font-size: 0.6875rem;
  font-weight: 600;
  background: var(--md3-secondary-container);
  border-radius: 999px;
}

.state-badge--now {
  color: var(--md3-on-primary);
  font-weight: 700;
  background: var(--md3-primary);
}

.program-location {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

.empty-text {
  padding: 4px 0 8px;
  color: var(--md3-on-surface-variant);
  font-size: 0.875rem;
}
</style>

<i18n lang="yaml" locale="en">
title:
  today: "Today's program"
  day: 'Program · Day {day}'
dayOf: 'Day {day} of {days}'
plan:
  a: 'Plan A'
  b: 'Plan B'
publication:
  a: 'Participants see plan A'
  b: 'Participants see plan B'
  both: 'Participants see both plans'
  none: 'Not published to participants'
program:
  open: 'Open program'
  allDay: 'All day'
  now: 'Now'
  startsIn: 'starting | in 1 min | in {n} min'
  showEarlier: 'Show {n} earlier item | Show {n} earlier items'
  hideEarlier: 'Hide earlier items'
  showLater: 'Show {n} more'
  hideLater: 'Show less'
  dayDone: "That's it for today"
  empty: 'Nothing planned for this day'
</i18n>

<i18n lang="yaml" locale="de">
title:
  today: 'Programm heute'
  day: 'Programm · Tag {day}'
dayOf: 'Tag {day} von {days}'
plan:
  a: 'Plan A'
  b: 'Plan B'
publication:
  a: 'Teilnehmende sehen Plan A'
  b: 'Teilnehmende sehen Plan B'
  both: 'Teilnehmende sehen beide Pläne'
  none: 'Für Teilnehmende nicht veröffentlicht'
program:
  open: 'Zum Programm'
  allDay: 'Ganztägig'
  now: 'Jetzt'
  startsIn: 'beginnt | in 1 Min. | in {n} Min.'
  showEarlier: '{n} früheren Punkt anzeigen | {n} frühere Punkte anzeigen'
  hideEarlier: 'Frühere Punkte ausblenden'
  showLater: '{n} weiteren Punkt anzeigen | {n} weitere Punkte anzeigen'
  hideLater: 'Weniger anzeigen'
  dayDone: 'Für heute ist alles vorbei'
  empty: 'Für diesen Tag ist nichts geplant'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  today: 'Programme du jour'
  day: 'Programme · Jour {day}'
dayOf: 'Jour {day} sur {days}'
plan:
  a: 'Plan A'
  b: 'Plan B'
publication:
  a: 'Les participants voient le plan A'
  b: 'Les participants voient le plan B'
  both: 'Les participants voient les deux plans'
  none: 'Non publié pour les participants'
program:
  open: 'Ouvrir le programme'
  allDay: 'Toute la journée'
  now: 'Maintenant'
  startsIn: 'commence | dans 1 min | dans {n} min'
  showEarlier: 'Afficher {n} élément précédent | Afficher {n} éléments précédents'
  hideEarlier: 'Masquer les éléments précédents'
  showLater: 'Afficher {n} élément suivant | Afficher {n} éléments suivants'
  hideLater: 'Afficher moins'
  dayDone: "C'est tout pour aujourd'hui"
  empty: 'Rien de prévu ce jour-là'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  today: 'Dzisiejszy program'
  day: 'Program · Dzień {day}'
dayOf: 'Dzień {day} z {days}'
plan:
  a: 'Plan A'
  b: 'Plan B'
publication:
  a: 'Uczestnicy widzą plan A'
  b: 'Uczestnicy widzą plan B'
  both: 'Uczestnicy widzą oba plany'
  none: 'Nieopublikowane dla uczestników'
program:
  open: 'Otwórz program'
  allDay: 'Cały dzień'
  now: 'Teraz'
  startsIn: 'zaczyna się | za 1 min | za {n} min'
  showEarlier: 'Pokaż wcześniejsze punkty ({n})'
  hideEarlier: 'Ukryj wcześniejsze punkty'
  showLater: 'Pokaż kolejne punkty ({n})'
  hideLater: 'Pokaż mniej'
  dayDone: 'To wszystko na dziś'
  empty: 'Na ten dzień nic nie zaplanowano'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  today: 'Dnešní program'
  day: 'Program · Den {day}'
dayOf: 'Den {day} z {days}'
plan:
  a: 'Plán A'
  b: 'Plán B'
publication:
  a: 'Účastníci vidí plán A'
  b: 'Účastníci vidí plán B'
  both: 'Účastníci vidí oba plány'
  none: 'Pro účastníky nezveřejněno'
program:
  open: 'Otevřít program'
  allDay: 'Celý den'
  now: 'Nyní'
  startsIn: 'začíná | za 1 min | za {n} min'
  showEarlier: 'Zobrazit dřívější body ({n})'
  hideEarlier: 'Skrýt dřívější body'
  showLater: 'Zobrazit další body ({n})'
  hideLater: 'Zobrazit méně'
  dayDone: 'To je pro dnešek vše'
  empty: 'Na tento den není nic naplánováno'
</i18n>
