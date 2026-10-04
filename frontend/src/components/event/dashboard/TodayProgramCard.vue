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
        :caption="caption"
      >
        <template #action>
          <m-btn
            :label="t('program.open')"
            :to="{ name: 'management.event.program-planner' }"
            icon-right="chevron_right"
            primary
            text
            no-caps
          />
        </template>
      </dashboard-card-header>
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
      <ol
        v-else-if="programItems.length > 0"
        class="program-list"
      >
        <li
          v-for="item in programItems"
          :key="item.id"
          class="program-item"
          :class="{ 'program-item--now': item.now }"
        >
          <span class="program-time">
            {{ item.time ?? t('program.allDay') }}
          </span>
          <span class="program-text">
            <span class="program-title">
              <plan-letter-icon
                v-if="item.plan !== 'both'"
                :plan="item.plan"
                size="11px"
                class="plan-letter"
              />
              {{ item.title }}
              <span
                v-if="item.now"
                class="now-badge"
              >
                {{ t('program.now') }}
              </span>
            </span>
            <span
              v-if="item.location"
              class="program-location"
            >
              {{ item.location }}
            </span>
          </span>
        </li>
      </ol>
      <div
        v-else
        class="empty-text"
      >
        {{ t('program.empty') }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Event } from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import PlanLetterIcon from '@/components/event/programPlanner/PlanLetterIcon.vue';
import { useProgramPlannerStore } from '@/stores/program-planner-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { eventDayOf, shownEventDate } from '@/composables/eventPhase';
import {
  formatLocalDate,
  parseLocalDate,
  parseTimeToMinutes,
} from '@/utils/date';

// The day's program; outside the event, its first day.
const { event } = defineProps<{
  event: Event;
}>();

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const programStore = useProgramPlannerStore();

const date = computed<string>(() => shownEventDate(event));

const isToday = computed<boolean>(
  () => date.value === formatLocalDate(new Date()),
);

const day = computed(() => eventDayOf(event, date.value));

const caption = computed<string>(
  () => `${t('dayOf', day.value)} · ${d(parseLocalDate(date.value), 'date')}`,
);

const programLoading = computed<boolean>(() => programStore.isLoading);

const programItems = computed(() => {
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    (programStore.data ?? [])
      .filter((item) => item.date === date.value)
      .map((item) => {
        const start = item.time ? parseTimeToMinutes(item.time) : null;
        const now =
          isToday.value &&
          start !== null &&
          item.duration !== null &&
          nowMinutes >= start &&
          nowMinutes < start + item.duration;

        return {
          id: item.id,
          time: item.time,
          title: to(item.title),
          location: item.location ? to(item.location) : null,
          plan: item.plan,
          now,
        };
      })
      // All-day items lead, the rest follow the clock.
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  );
});
</script>

<style scoped>
.program-card {
  border-radius: 16px;
}

.today-section {
  padding-top: 0;
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
  grid-template-columns: 4rem minmax(0, 1fr);
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
}

.program-item--now {
  background: var(--md3-primary-container);
}

.program-time {
  color: var(--md3-on-surface-variant);
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.program-item--now .program-time,
.program-item--now .program-title {
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

.plan-letter {
  width: 18px;
  height: 18px;
  color: var(--md3-on-secondary-container);
  background: var(--md3-secondary-container);
  border-radius: 6px;
}

.now-badge {
  padding: 0 8px;
  color: var(--md3-on-primary);
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--md3-primary);
  border-radius: 999px;
}

.program-location {
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
program:
  open: 'Open program'
  allDay: 'All day'
  now: 'Now'
  empty: 'Nothing planned for this day'
</i18n>

<i18n lang="yaml" locale="de">
title:
  today: 'Programm heute'
  day: 'Programm · Tag {day}'
dayOf: 'Tag {day} von {days}'
program:
  open: 'Zum Programm'
  allDay: 'Ganztägig'
  now: 'Jetzt'
  empty: 'Für diesen Tag ist nichts geplant'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  today: 'Programme du jour'
  day: 'Programme · Jour {day}'
dayOf: 'Jour {day} sur {days}'
program:
  open: 'Ouvrir le programme'
  allDay: 'Toute la journée'
  now: 'Maintenant'
  empty: 'Rien de prévu ce jour-là'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  today: 'Dzisiejszy program'
  day: 'Program · Dzień {day}'
dayOf: 'Dzień {day} z {days}'
program:
  open: 'Otwórz program'
  allDay: 'Cały dzień'
  now: 'Teraz'
  empty: 'Na ten dzień nic nie zaplanowano'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  today: 'Dnešní program'
  day: 'Program · Den {day}'
dayOf: 'Den {day} z {days}'
program:
  open: 'Otevřít program'
  allDay: 'Celý den'
  now: 'Nyní'
  empty: 'Na tento den není nic naplánováno'
</i18n>
