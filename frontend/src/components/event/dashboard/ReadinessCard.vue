<template>
  <q-card
    flat
    bordered
    class="readiness-card"
  >
    <q-card-section class="q-pb-sm">
      <dashboard-card-header
        icon="fact_check"
        tone="secondary"
        :title="t('title')"
        :caption="t('subtitle')"
      />
    </q-card-section>

    <q-list class="readiness-list">
      <q-item
        v-for="row in rows"
        :key="row.key"
        :to="{ name: row.route }"
        clickable
        class="readiness-row"
        :data-test="`dashboard-readiness-${row.key}`"
      >
        <q-item-section avatar>
          <q-icon
            :name="row.done ? 'check_circle' : row.icon"
            :class="row.done ? 'text-positive' : 'readiness-icon'"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label class="row items-baseline justify-between no-wrap">
            <span class="ellipsis">{{ row.label }}</span>
            <q-skeleton
              v-if="row.loading"
              type="text"
              width="3rem"
            />
            <span
              v-else
              class="readiness-count"
            >
              {{ row.value }} / {{ row.total }}
            </span>
          </q-item-label>
          <q-skeleton
            v-if="row.loading"
            type="rect"
            height="4px"
            class="rounded-full q-mt-xs"
          />
          <div
            v-else
            class="readiness-bar"
            role="progressbar"
            :aria-valuenow="row.value"
            :aria-valuemax="row.total"
            :aria-label="row.label"
          >
            <div
              class="readiness-bar__fill"
              :class="{ 'readiness-bar__fill--done': row.done }"
              :style="{ width: `${row.percent}%` }"
            />
          </div>
        </q-item-section>
        <q-item-section side>
          <q-icon
            name="chevron_right"
            size="18px"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Event } from '@camp-registration/common/entities';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import { useProgramPlannerStore } from '@/stores/program-planner-store';
import { useEventStatistics } from '@/composables/eventStatistics';
import { eventDayOf, eventDays } from '@/composables/eventPhase';

// Rendered only when at least one row is enabled.
const {
  event,
  loading = false,
  rooms = false,
  program = false,
} = defineProps<{
  event: Event;
  loading?: boolean;
  rooms?: boolean;
  program?: boolean;
}>();

const { t } = useI18n();
const programStore = useProgramPlannerStore();
const stats = useEventStatistics();

interface ReadinessRow {
  key: string;
  label: string;
  icon: string;
  route: string;
  value: number;
  total: number;
  loading: boolean;
}

const rows = computed(() => {
  const list: ReadinessRow[] = [];

  if (rooms) {
    const accepted = stats.registrations.value.filter(
      (r) => r.status === 'ACCEPTED',
    );
    list.push({
      key: 'rooms',
      label: t('rooms'),
      icon: 'bed',
      route: 'management.event.room-planner',
      value: accepted.filter((r) => r.room).length,
      total: accepted.length,
      loading,
    });
  }

  if (program) {
    const { first, last } = eventDays(event);
    const plannedDays = new Set(
      (programStore.data ?? [])
        .map((item) => item.date)
        .filter((date) => date !== null && date >= first && date <= last),
    );
    list.push({
      key: 'program',
      label: t('program'),
      icon: 'calendar_month',
      route: 'management.event.program-planner',
      value: plannedDays.size,
      total: eventDayOf(event, last).days,
      loading: programStore.isLoading,
    });
  }

  return list.map((row) => ({
    ...row,
    done: row.total > 0 && row.value >= row.total,
    percent: row.total > 0 ? Math.min(100, (row.value / row.total) * 100) : 0,
  }));
});
</script>

<style scoped>
.readiness-card {
  border-radius: 16px;
}

.readiness-list {
  padding: 0 8px 8px;
}

.readiness-row {
  border-radius: 12px;
}

.readiness-icon {
  color: var(--md3-primary);
}

.readiness-count {
  margin-left: 8px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.readiness-bar {
  height: 4px;
  margin-top: 6px;
  overflow: hidden;
  background: var(--md3-surface-container-highest);
  border-radius: 999px;
}

.readiness-bar__fill {
  height: 100%;
  background: var(--md3-primary);
  border-radius: 999px;
}

.readiness-bar__fill--done {
  background: var(--md3-positive);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Readiness'
subtitle: 'Before the event starts'
rooms: 'Rooms assigned'
program: 'Days with program'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Vorbereitung'
subtitle: 'Vor Veranstaltungsbeginn'
rooms: 'Zimmer zugeteilt'
program: 'Tage mit Programm'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Préparatifs'
subtitle: "Avant le début de l'événement"
rooms: 'Chambres attribuées'
program: 'Jours avec programme'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Przygotowania'
subtitle: 'Przed rozpoczęciem wydarzenia'
rooms: 'Przydzielone pokoje'
program: 'Dni z programem'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Příprava'
subtitle: 'Před začátkem akce'
rooms: 'Přidělené pokoje'
program: 'Dny s programem'
</i18n>
