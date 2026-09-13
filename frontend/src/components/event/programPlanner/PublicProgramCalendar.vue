<template>
  <div class="public-program column">
    <div
      class="public-program__nav row items-center justify-center q-gutter-sm q-mb-md"
    >
      <q-btn
        icon="chevron_left"
        flat
        round
        dense
        :disable="date <= minDate"
        @click="emit('previous')"
      >
        <q-tooltip>{{ t('previous') }}</q-tooltip>
      </q-btn>
      <div class="text-subtitle1 text-weight-medium">{{ dateLabel }}</div>
      <q-btn
        icon="chevron_right"
        flat
        round
        dense
        :disable="date >= maxDate"
        @click="emit('next')"
      >
        <q-tooltip>{{ t('next') }}</q-tooltip>
      </q-btn>
    </div>

    <div
      v-if="!published"
      class="text-body2 text-grey-7 text-center q-pa-md"
    >
      {{ t('notPublished') }}
    </div>

    <template v-else>
      <div
        v-if="items.length === 0"
        class="text-body2 text-grey-7 text-center q-pa-md"
      >
        {{ t('empty') }}
      </div>

      <q-list
        v-else
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="item in sortedItems"
          :key="item.id"
          class="public-program__item"
          :style="{ borderLeftColor: item.color ?? '#2196F3' }"
        >
          <q-item-section
            v-if="item.time"
            side
            class="public-program__time"
          >
            {{ item.time }}
          </q-item-section>

          <q-item-section>
            <q-item-label class="row items-center q-gutter-x-xs">
              <plan-letter-icon
                v-if="showPlanIcon(item)"
                :plan="item.plan === 'a' ? 'a' : 'b'"
                size="16px"
              />
              {{ to(item.title) }}
            </q-item-label>
            <q-item-label
              v-if="item.location"
              caption
            >
              {{ to(item.location) }}
            </q-item-label>
            <q-item-label
              v-if="item.details"
              caption
            >
              {{ to(item.details) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ProgramItem } from '@camp-registration/common/entities';
import { currentDateInTimeZone } from '@camp-registration/common/utils';
import { addDays } from '@/utils/date';
import { useObjectTranslation } from '@/composables/objectTranslation';
import PlanLetterIcon from '@/components/event/programPlanner/PlanLetterIcon.vue';

const { date, minDate, maxDate, published, plan, items, timezone } =
  defineProps<{
    /** The day being shown, `YYYY-MM-DD`. */
    date: string;
    /** Inclusive navigation bounds — the event's own dates. */
    minDate: string;
    maxDate: string;
    /** Whether `date` specifically has a plan published for it. */
    published: boolean;
    /** The plan published for `date`; `null` when `published` is `false`. */
    plan: 'a' | 'b' | 'both' | null;
    items: ProgramItem[];
    /** The event's own IANA timezone — what "today"/"tomorrow" are relative to. */
    timezone: string;
  }>();

const emit = defineEmits<{
  (e: 'previous'): void;
  (e: 'next'): void;
}>();

const { t, locale } = useI18n();
const { to } = useObjectTranslation();

const dateLabel = computed<string>(() => {
  const today = currentDateInTimeZone(timezone);
  if (date === today) {
    return t('today');
  }
  if (date === addDays(today, 1)) {
    return t('tomorrow');
  }

  const [year, month, day] = date.split('-').map(Number);
  const formatter = new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return formatter.format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
});

const sortedItems = computed<ProgramItem[]>(() =>
  [...items].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
);

function showPlanIcon(item: ProgramItem): boolean {
  return plan === 'both' && item.plan !== 'both';
}
</script>

<style lang="scss" scoped>
.public-program__item {
  border-left: 4px solid;
}

.public-program__time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  min-width: 3.5em;
}
</style>

<i18n lang="yaml" locale="en">
previous: 'Previous day'
next: 'Next day'
today: 'Today'
tomorrow: 'Tomorrow'
empty: 'Nothing scheduled'
notPublished: 'The program for this day has not been published yet.'
</i18n>

<i18n lang="yaml" locale="de">
previous: 'Vorheriger Tag'
next: 'Nächster Tag'
today: 'Heute'
tomorrow: 'Morgen'
empty: 'Nichts geplant'
notPublished: 'Das Programm für diesen Tag wurde noch nicht veröffentlicht.'
</i18n>

<i18n lang="yaml" locale="fr">
previous: 'Jour précédent'
next: 'Jour suivant'
today: "Aujourd'hui"
tomorrow: 'Demain'
empty: 'Rien de prévu'
notPublished: "Le programme de ce jour n'a pas encore été publié."
</i18n>

<i18n lang="yaml" locale="pl">
previous: 'Poprzedni dzień'
next: 'Następny dzień'
today: 'Dzisiaj'
tomorrow: 'Jutro'
empty: 'Brak zaplanowanych wydarzeń'
notPublished: 'Program na ten dzień nie został jeszcze opublikowany.'
</i18n>

<i18n lang="yaml" locale="cs">
previous: 'Předchozí den'
next: 'Další den'
today: 'Dnes'
tomorrow: 'Zítra'
empty: 'Nic naplánováno'
notPublished: 'Program na tento den ještě nebyl zveřejněn.'
</i18n>
