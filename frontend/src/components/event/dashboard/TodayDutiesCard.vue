<template>
  <q-card
    flat
    bordered
    class="duties-card"
    :class="{ 'duties-card--open': openCount > 0 }"
  >
    <q-card-section>
      <dashboard-card-header
        icon="cleaning_services"
        :tone="openCount > 0 ? 'warning' : 'primary'"
        :title="isToday ? t('title.today') : t('title.day', { day: day.day })"
      >
        <template #caption>
          <q-skeleton
            v-if="dutiesLoading"
            type="text"
            width="40%"
          />
          <template v-else-if="dayDuties.length > 0">
            {{
              openCount > 0
                ? t('duties.open', openCount)
                : t('duties.filled', dayDuties.length)
            }}
          </template>
        </template>
        <template #action>
          <m-btn
            :label="t('duties.openRoster')"
            :to="{ name: 'management.event.chore-planner' }"
            icon-right="chevron_right"
            primary
            text
            no-caps
          />
        </template>
      </dashboard-card-header>
    </q-card-section>

    <q-card-section class="today-section">
      <template v-if="dutiesLoading">
        <q-skeleton
          v-for="width in ['60%', '48%']"
          :key="width"
          type="text"
          :width="width"
        />
      </template>
      <q-list
        v-else-if="dayDuties.length > 0"
        class="duties-list"
      >
        <q-item
          v-for="duty in dayDuties"
          :key="duty.id"
          dense
        >
          <q-item-section>
            <q-item-label :class="{ 'text-strike': duty.cancelled }">
              {{ duty.title }}
            </q-item-label>
            <q-item-label caption>
              <span v-if="duty.names">{{ duty.names }}</span>
              <span
                v-if="duty.open > 0 && !duty.cancelled"
                class="open-text text-weight-medium"
              >
                {{ duty.names ? ' · ' : '' }}{{ t('duties.spots', duty.open) }}
              </span>
            </q-item-label>
          </q-item-section>
          <q-item-section
            v-if="duty.done"
            side
          >
            <q-icon
              name="task_alt"
              color="positive"
            />
          </q-item-section>
        </q-item>
      </q-list>
      <div
        v-else
        class="empty-text"
      >
        {{ t('duties.empty') }}
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
import { useDayDuties } from '@/composables/dayDuties';
import { eventDayOf, shownEventDate } from '@/composables/eventPhase';
import { formatLocalDate } from '@/utils/date';

// The day's roster; outside the event, its first day.
const { event } = defineProps<{
  event: Event;
}>();

const { t } = useI18n();

const date = computed<string>(() => shownEventDate(event));

const isToday = computed<boolean>(
  () => date.value === formatLocalDate(new Date()),
);

const day = computed(() => eventDayOf(event, date.value));

const {
  duties: dayDuties,
  openCount,
  isLoading: dutiesLoading,
} = useDayDuties(date);
</script>

<style scoped>
.duties-card {
  border-radius: 16px;
}

.duties-card--open {
  border-color: color-mix(in srgb, var(--md3-warning) 45%, transparent);
}

.today-section {
  padding-top: 0;
}

.open-text {
  color: var(--md3-on-warning-container);
}

.duties-list {
  margin: 0 -8px;
}

.empty-text {
  padding: 4px 0 8px;
  color: var(--md3-on-surface-variant);
  font-size: 0.875rem;
}
</style>

<i18n lang="yaml" locale="en">
title:
  today: "Today's duties"
  day: 'Duties · Day {day}'
duties:
  open: 'No open spots | 1 spot still open | {n} spots still open'
  filled: 'No duties | 1 duty, fully staffed | {n} duties, all fully staffed'
  spots: 'no open spots | 1 spot open | {n} spots open'
  openRoster: 'Open roster'
  empty: 'No duties on this day'
</i18n>

<i18n lang="yaml" locale="de">
title:
  today: 'Dienste heute'
  day: 'Dienste · Tag {day}'
duties:
  open: 'Keine offenen Plätze | 1 Platz noch offen | {n} Plätze noch offen'
  filled: 'Keine Dienste | 1 Dienst, voll besetzt | {n} Dienste, alle voll besetzt'
  spots: 'keine offenen Plätze | 1 Platz offen | {n} Plätze offen'
  openRoster: 'Zum Dienstplan'
  empty: 'Keine Dienste an diesem Tag'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  today: 'Corvées du jour'
  day: 'Corvées · Jour {day}'
duties:
  open: 'Aucune place libre | 1 place encore libre | {n} places encore libres'
  filled: 'Aucune corvée | 1 corvée, au complet | {n} corvées, toutes au complet'
  spots: 'aucune place libre | 1 place libre | {n} places libres'
  openRoster: 'Ouvrir le plan'
  empty: 'Aucune corvée ce jour-là'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  today: 'Dzisiejsze dyżury'
  day: 'Dyżury · Dzień {day}'
duties:
  open: 'Brak wolnych miejsc | 1 miejsce wciąż wolne | {n} miejsc wciąż wolnych'
  filled: 'Brak dyżurów | 1 dyżur, w pełni obsadzony | {n} dyżurów, wszystkie obsadzone'
  spots: 'brak wolnych miejsc | 1 wolne miejsce | {n} wolnych miejsc'
  openRoster: 'Otwórz grafik'
  empty: 'Brak dyżurów w tym dniu'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  today: 'Dnešní služby'
  day: 'Služby · Den {day}'
duties:
  open: 'Žádná volná místa | 1 místo je ještě volné | {n} míst je ještě volných'
  filled: 'Žádné služby | 1 služba, plně obsazená | {n} služeb, všechny plně obsazené'
  spots: 'žádná volná místa | 1 volné místo | {n} volných míst'
  openRoster: 'Otevřít rozpis'
  empty: 'Žádné služby v tento den'
</i18n>
