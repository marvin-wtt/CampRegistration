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

      <div
        v-else
        class="public-program__list"
      >
        <div
          v-for="slot in slots"
          :key="slot.key"
          class="public-program__slot"
        >
          <!-- Only shown for a slot with genuine side-by-side overlap — a
               single lane needs no label, and labeling every slot would bury
               the one piece of information that actually matters here. -->
          <div
            v-if="slot.lanes.length > 1"
            class="public-program__slot-label"
          >
            <q-icon
              name="call_split"
              size="12px"
            />
            {{ t('alternatives', { count: slot.lanes.length }) }}
          </div>

          <div class="public-program__slot-lanes">
            <!-- Each lane never has two overlapping items — they're free to
                 stack sequentially. Only items in *different* lanes actually
                 overlap each other. -->
            <div
              v-for="(lane, laneIndex) in slot.lanes"
              :key="laneIndex"
              class="public-program__lane"
            >
              <div
                v-for="item in lane"
                :key="item.id"
                class="public-program__item"
                :style="{ borderLeftColor: item.color ?? '#2196F3' }"
              >
                <div
                  v-if="item.time"
                  class="public-program__time"
                >
                  {{ item.time }}
                </div>
                <div
                  class="public-program__title row items-center q-gutter-x-xs"
                >
                  <plan-letter-icon
                    v-if="showPlanIcon(item)"
                    :plan="item.plan === 'a' ? 'a' : 'b'"
                    size="16px"
                  />
                  <span>{{ to(item.title) }}</span>
                </div>
                <div
                  v-if="item.location"
                  class="text-caption text-grey-7"
                >
                  {{ to(item.location) }}
                </div>
                <div
                  v-if="item.details"
                  class="text-caption text-grey-7"
                >
                  {{ to(item.details) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ProgramItem } from '@camp-registration/common/entities';
import { currentDateInTimeZone } from '@camp-registration/common/utils';
import { addDays, parseTimeToMinutes } from '@/utils/date';
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

interface TimedEntry {
  item: ProgramItem;
  start: number;
  end: number;
}

interface Slot {
  /** Key for `v-for` — the id of the slot's first item is stable enough. */
  key: string;
  /**
   * Items that never overlap each other and so can stack sequentially.
   * Two items land in *different* lanes only when they actually overlap —
   * lanes are the unit that's actually simultaneous, not the whole slot.
   */
  lanes: ProgramItem[][];
}

/** Missing duration defaults to 60 minutes, matching `ProgramCalendar.vue`'s own `eventDepths` overlap computation. */
function toTimedEntries(source: ProgramItem[]): TimedEntry[] {
  return source
    .filter((item): item is ProgramItem & { time: string } => !!item.time)
    .map((item) => {
      const start = parseTimeToMinutes(item.time) ?? 0;
      return { item, start, end: start + (item.duration ?? 60) };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

/**
 * Splits chronologically-sorted entries into clusters of transitively
 * overlapping items — extends the current cluster whenever the next entry
 * starts before the cluster's running end. This only scopes *which* items
 * need lane treatment together; it does not by itself mean every pair in a
 * cluster overlaps (see `assignLanes`).
 */
function clusterOverlapping(entries: TimedEntry[]): TimedEntry[][] {
  const clusters: TimedEntry[][] = [];
  let current: TimedEntry[] = [];
  let currentEnd = -Infinity;

  for (const entry of entries) {
    if (current.length > 0 && entry.start < currentEnd) {
      current.push(entry);
      currentEnd = Math.max(currentEnd, entry.end);
    } else {
      if (current.length > 0) {
        clusters.push(current);
      }
      current = [entry];
      currentEnd = entry.end;
    }
  }
  if (current.length > 0) {
    clusters.push(current);
  }

  return clusters;
}

/**
 * Greedy interval-graph coloring (the same algorithm behind "how many
 * meeting rooms do we need"): each entry joins the first lane whose last
 * item already ended by this entry's start, or opens a new lane if none
 * qualifies. This is what actually fixes clustering's blind spot — A
 * (9:00–12:00) overlapping both B (9:00–9:30) and C (11:30–12:00), with B and
 * C never overlapping each other, puts B and C in the *same* lane (stacked,
 * correctly implying "not simultaneous") and only A in a separate one,
 * instead of all three being flattened into one "happening at once" group.
 */
function assignLanes(entries: TimedEntry[]): ProgramItem[][] {
  const lanes: { items: ProgramItem[]; lastEnd: number }[] = [];

  for (const entry of entries) {
    const lane = lanes.find((l) => l.lastEnd <= entry.start);
    if (lane) {
      lane.items.push(entry.item);
      lane.lastEnd = entry.end;
    } else {
      lanes.push({ items: [entry.item], lastEnd: entry.end });
    }
  }

  return lanes.map((lane) => lane.items);
}

/**
 * Slots render so overlapping items are visually distinct from merely
 * sequential ones — a plain list sorted by start time reads two items
 * happening at the same time (two parallel activities, or something
 * alongside "free time") as sequential, which is actively misleading on a
 * page participants use to plan their day. Items without a time can't
 * meaningfully overlap anything and are never lane-split.
 */
const slots = computed<Slot[]>(() => {
  const untimed = items.filter((item) => !item.time);
  const clusters = clusterOverlapping(toTimedEntries(items));

  const result: Slot[] = untimed.map((item) => ({
    key: item.id,
    lanes: [[item]],
  }));

  for (const cluster of clusters) {
    result.push({
      key: cluster[0]!.item.id,
      lanes: assignLanes(cluster),
    });
  }

  return result;
});

function showPlanIcon(item: ProgramItem): boolean {
  return plan === 'both' && item.plan !== 'both';
}
</script>

<style lang="scss" scoped>
.public-program__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.public-program__slot-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 4px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--md3-on-surface-variant);
}

.public-program__slot-lanes {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
}

// One lane's items never overlap each other, so they stack; a slot with only
// one lane (the common case) is just this stack on its own, unchanged from a
// plain list.
.public-program__lane {
  display: flex;
  flex: 1 1 220px;
  flex-direction: column;
  min-width: 0;
  gap: 8px;
}

.public-program__item {
  min-width: 0;
  border-left: 4px solid;
  border-radius: 8px;
  padding: 8px 12px;
  background-color: var(--md3-surface-container-low);
}

.public-program__time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 13px;
}

.public-program__title {
  font-weight: 500;
}
</style>

<i18n lang="yaml" locale="en">
previous: 'Previous day'
next: 'Next day'
today: 'Today'
tomorrow: 'Tomorrow'
empty: 'Nothing scheduled'
notPublished: 'The program for this day has not been published yet.'
alternatives: '{count} alternatives'
</i18n>

<i18n lang="yaml" locale="de">
previous: 'Vorheriger Tag'
next: 'Nächster Tag'
today: 'Heute'
tomorrow: 'Morgen'
empty: 'Nichts geplant'
notPublished: 'Das Programm für diesen Tag wurde noch nicht veröffentlicht.'
alternatives: '{count} Alternativen'
</i18n>

<i18n lang="yaml" locale="fr">
previous: 'Jour précédent'
next: 'Jour suivant'
today: "Aujourd'hui"
tomorrow: 'Demain'
empty: 'Rien de prévu'
notPublished: "Le programme de ce jour n'a pas encore été publié."
alternatives: '{count} alternatives'
</i18n>

<i18n lang="yaml" locale="pl">
previous: 'Poprzedni dzień'
next: 'Następny dzień'
today: 'Dzisiaj'
tomorrow: 'Jutro'
empty: 'Brak zaplanowanych wydarzeń'
notPublished: 'Program na ten dzień nie został jeszcze opublikowany.'
alternatives: '{count} alternatywy'
</i18n>

<i18n lang="yaml" locale="cs">
previous: 'Předchozí den'
next: 'Další den'
today: 'Dnes'
tomorrow: 'Zítra'
empty: 'Nic naplánováno'
notPublished: 'Program na tento den ještě nebyl zveřejněn.'
alternatives: '{count} alternativy'
</i18n>
