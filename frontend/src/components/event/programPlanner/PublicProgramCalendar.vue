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
        :disable="loading || date <= minDate"
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
        :disable="loading || date >= maxDate"
        @click="emit('next')"
      >
        <q-tooltip>{{ t('next') }}</q-tooltip>
      </q-btn>
    </div>

    <!-- A day switch is a fresh fetch for a different day's data, not a
         partial update of what's on screen — so it crossfades to skeletons
         entirely rather than dimming stale items that are about to be thrown
         away. Each branch gets its own `key` so the transition always sees a
         genuinely new node to fade in, not an existing `div` being patched. -->
    <transition
      name="public-program-fade"
      mode="out-in"
    >
      <div
        v-if="loading"
        key="loading"
        class="public-program__list"
      >
        <public-program-item-card-skeleton
          v-for="(width, index) in skeletonWidths"
          :key="index"
          :title-width="width"
        />
      </div>

      <div
        v-else-if="!published"
        key="unpublished"
        class="text-body2 text-grey-7 text-center q-pa-md"
      >
        {{ t('notPublished') }}
      </div>

      <div
        v-else-if="items.length === 0"
        key="empty"
        class="text-body2 text-grey-7 text-center q-pa-md"
      >
        {{ t('empty') }}
      </div>

      <div
        v-else
        key="list"
        class="public-program__list"
      >
        <div
          v-for="slot in slots"
          :key="slot.key"
          class="public-program__slot"
        >
          <!-- Plan 'both' items always span the full width, regardless of
               what else is in this slot. -->
          <public-program-item-card
            v-for="item in slot.full"
            :key="item.id"
            :item="item"
            class="public-program__full-item"
          />

          <!-- Only shown for a genuine left/right (or generic-overlap) split
               — a single lane needs no label, and labeling every slot would
               bury the one piece of information that actually matters here. -->
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

          <div
            v-if="slot.lanes.length > 0"
            class="public-program__slot-lanes"
          >
            <!-- Each lane never has two overlapping items — they're free to
                 stack sequentially. Only items in *different* lanes actually
                 overlap each other (or, with a genuine a/b pair, the left
                 lane is always plan 'a' and the right always plan 'b'). -->
            <div
              v-for="(lane, laneIndex) in slot.lanes"
              :key="laneIndex"
              class="public-program__lane"
            >
              <public-program-item-card
                v-for="item in lane"
                :key="item.id"
                :item="item"
                :show-plan-icon="showPlanIcon(item)"
              />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ProgramItem } from '@camp-registration/common/entities';
import { currentDateInTimeZone } from '@camp-registration/common/utils';
import { addDays } from '@/utils/date';
import { programItemMinutesRange } from '@/utils/programItem';
import PublicProgramItemCard from '@/components/event/programPlanner/PublicProgramItemCard.vue';
import PublicProgramItemCardSkeleton from '@/components/event/programPlanner/PublicProgramItemCardSkeleton.vue';

const {
  date,
  minDate,
  maxDate,
  published,
  plan,
  items,
  timezone,
  loading = false,
} = defineProps<{
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
  /** Whether a different day is currently being fetched to replace this one. */
  loading?: boolean;
}>();

// Varied widths so the placeholder list doesn't look like a row of identical
// bars — the exact values are arbitrary, just visually distinct.
const skeletonWidths = ['85%', '60%', '70%'];

const emit = defineEmits<{
  (e: 'previous'): void;
  (e: 'next'): void;
}>();

const { t, locale } = useI18n();

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
  /** Plan `'both'` items — always full width, regardless of what else is in the slot. */
  full: ProgramItem[];
  /**
   * The non-`'both'` items, laid out side by side. When the slot has at
   * least one plan `'a'` item and at least one plan `'b'` item, the 'a'
   * lanes always precede the 'b' lanes — a left/right split — mirroring
   * `ProgramCalendar.vue`'s own `viewBoth` plan split, since a's and b's are
   * weather-contingency alternatives by construction, not incidentally
   * overlapping activities. Each side still runs through `assignLanes` on
   * its own, so two same-plan items that overlap each other land in
   * separate lanes rather than being flattened into one. Otherwise (no
   * genuine a/b pair here) it falls back to generic time-overlap lanes for
   * whichever single plan is present.
   */
  lanes: ProgramItem[][];
}

function toTimedEntries(source: ProgramItem[]): TimedEntry[] {
  const entries: TimedEntry[] = [];

  for (const item of source) {
    const range = programItemMinutesRange(item);
    if (range) {
      entries.push({ item, start: range.start, end: range.end });
    }
  }

  return entries.sort((a, b) => a.start - b.start || a.end - b.end);
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
 * happening at the same time as sequential, which is actively misleading on
 * a page participants use to plan their day. Items without a time can't
 * meaningfully overlap anything and are never split.
 *
 * The split itself follows the plan a/b/both convention, not a generic
 * overlap heuristic: within a time-overlapping cluster, an 'a' item always
 * belongs on the left and a 'b' item always on the right whenever both are
 * present — that's what the plan field means — while 'both' items are
 * always full width. Only when a cluster has no genuine a/b pair (e.g. two
 * unrelated plan-'a'-only items that happen to overlap) does it fall back to
 * generic time-overlap lanes for those remaining items.
 */
const slots = computed<Slot[]>(() => {
  const untimed = items.filter((item) => !item.time);
  const clusters = clusterOverlapping(toTimedEntries(items));

  const result: Slot[] = untimed.map((item) => ({
    key: item.id,
    full: [],
    lanes: [[item]],
  }));

  for (const cluster of clusters) {
    const full = cluster
      .filter((entry) => entry.item.plan === 'both')
      .map((entry) => entry.item);
    const aEntries = cluster.filter((entry) => entry.item.plan === 'a');
    const bEntries = cluster.filter((entry) => entry.item.plan === 'b');

    // A genuine a/b pair still keeps 'a' on the left and 'b' on the right,
    // but each side runs through the same lane assignment as the fallback
    // below — two overlapping items sharing a plan compete for space just
    // like two unrelated overlapping items would.
    const lanes: ProgramItem[][] =
      aEntries.length > 0 && bEntries.length > 0
        ? [...assignLanes(aEntries), ...assignLanes(bEntries)]
        : assignLanes(cluster.filter((entry) => entry.item.plan !== 'both'));

    result.push({ key: cluster[0]!.item.id, full, lanes });
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

.public-program__full-item + .public-program__full-item,
.public-program__full-item + .public-program__slot-label,
.public-program__full-item + .public-program__slot-lanes {
  margin-top: 8px;
}

.public-program-fade-enter-active,
.public-program-fade-leave-active {
  transition: opacity 0.15s ease;
}

.public-program-fade-enter-from,
.public-program-fade-leave-to {
  opacity: 0;
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
