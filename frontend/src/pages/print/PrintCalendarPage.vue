<template>
  <q-page class="print-page">
    <div
      v-if="error"
      class="q-pa-md"
    >
      <q-banner
        inline-actions
        rounded
        class="bg-negative text-white"
      >
        {{ error }}
      </q-banner>
    </div>

    <div
      v-else-if="!data"
      class="q-pa-md"
    >
      <q-banner
        rounded
        class="bg-grey-3 text-black"
      >
        Preparing document…
      </q-banner>
    </div>

    <div
      v-else
      class="print-sheet"
      :class="isPortrait ? 'print-sheet--portrait' : 'print-sheet--landscape'"
    >
      <!-- Page header -->
      <header
        ref="calPhRef"
        class="cal-ph"
      >
        <h1 class="cal-ph__titles">
          <span
            v-for="line in titleLines"
            :key="line"
          >
            {{ line }}
          </span>
        </h1>
        <div class="cal-ph__meta">
          <div class="cal-ph__range">{{ headerDateRange }}</div>
          <div
            v-if="planLabel"
            class="cal-ph__plan"
          >
            {{ planLabel }}
          </div>
        </div>
      </header>

      <!-- Calendar grid -->
      <div
        class="cal-print"
        :style="{ '--slot-h': `${slotHeight}px` }"
      >
        <!-- Day header row -->
        <div
          ref="headRowRef"
          class="cal-print__head-row"
        >
          <div class="cal-print__gutter" />
          <div
            v-for="day in visibleDays"
            :key="day"
            class="cal-print__day-head"
          >
            <div class="cal-print__day-head__wd">{{ formatWeekday(day) }}</div>
            <div class="cal-print__day-head__d">{{ formatDay(day) }}</div>
            <div
              v-if="showPlanSplit"
              class="cal-print__day-head__ab"
            >
              <span>A</span>
              <span>B</span>
            </div>
          </div>
        </div>

        <!-- All-day events, only rendered when there is something to show -->
        <div
          v-if="hasAllDayEvents"
          ref="allDayRowRef"
          class="cal-print__allday-row"
        >
          <div class="cal-print__gutter cal-print__gutter--allday">
            {{ allDayLabel }}
          </div>
          <div
            v-for="day in visibleDays"
            :key="day"
            class="cal-print__allday-cell"
          >
            <div
              v-for="event in getFullDayEvents(day)"
              :key="event.id"
              class="cal-print__chip"
              :style="chipStyle(event)"
            >
              {{ toAll(event.title) }}
            </div>
          </div>
        </div>

        <!-- Body: time gutter + day columns -->
        <div class="cal-print__body">
          <!-- Time labels -->
          <div class="cal-print__gutter">
            <div
              v-for="slot in timeSlots"
              :key="slot.minutes"
              class="cal-print__time-label"
              :class="{ 'cal-print__time-label--hour': slot.isHour }"
            >
              <span v-if="slot.isHour">{{ slot.text }}</span>
            </div>
          </div>

          <!-- Day columns -->
          <div class="cal-print__day-cols">
            <div
              v-for="day in visibleDays"
              :key="day"
              class="cal-print__day-col"
              :class="{ 'cal-print__day-col--split': showPlanSplit }"
            >
              <div
                v-for="slot in timeSlots"
                :key="slot.minutes"
                class="cal-print__slot"
                :class="{
                  'cal-print__slot--hour': slot.isHour,
                  'cal-print__slot--band': slot.band,
                }"
              />
              <div
                v-for="item in layoutFor(day)"
                :key="item.id"
                class="cal-print__event"
                :class="{ 'cal-print__event--compact': item.compact }"
                :style="item.style"
              >
                <div class="cal-print__event__body">
                  <div class="cal-print__event__title">
                    <span
                      v-if="item.compact"
                      class="cal-print__event__time"
                      >{{ item.time }}</span
                    >{{ item.title }}
                  </div>
                  <div
                    v-if="!item.compact"
                    class="cal-print__event__meta"
                  >
                    {{ item.meta }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePrintPage, waitForStableLayout } from '@/composables/printPage';
import {
  formatLocalDate,
  parseLocalDate,
  parseTimeToMinutes,
} from '@/utils/date';
import {
  DEFAULT_EVENT_COLOR,
  fillColor,
  formatMinutesAsTime,
  layoutDayEvents,
  type EventBox,
} from '@/pages/print/calendarLayout';
import type {
  ProgramEvent,
  Translatable,
} from '@camp-registration/common/entities';

interface PrintCamp {
  name: Translatable;
  startAt: string;
  endAt: string;
  locales: string[];
}

interface PrintData {
  locale?: string;
  camp: PrintCamp;
  events: ProgramEvent[];
  date: string;
  days: number;
  plan: 'a' | 'b' | 'both';
  dayStart: string;
  dayEnd: string;
  interval: number;
}

interface TimeSlot {
  minutes: number;
  text: string;
  isHour: boolean;
  band: boolean;
}

/** An event placed in a day column: geometry plus the strings to render. */
interface PlacedEvent {
  id: string;
  title: string;
  time: string;
  meta: string;
  compact: boolean;
  style: Record<string, string>;
}

const { locale, t } = useI18n();

const { payload: data, error } = usePrintPage<PrintData>({
  messagePrefix: 'PRINT_CALENDAR',
  defaultStorageKey: 'print:calendar:payload',
  beforePrint: fitEventText,
  prepare: async () => {
    // First pass: template renders with data, the measured refs become available
    await waitForStableLayout();
    updateSlotHeight();
    // Second pass: --slot-h applied, slots have correct heights
    await waitForStableLayout();
    fitEventText();
  },
});

const campLocales = computed<string[]>(
  () => data.value?.camp.locales ?? [locale.value],
);
const primaryLocale = computed<string>(
  () => campLocales.value[0] ?? locale.value,
);

// "All day" label shown in every camp locale, deduplicated
const allDayLabel = computed<string>(() => {
  const labels = campLocales.value.map((l) => t('allDay', {}, { locale: l }));

  return [...new Set(labels)].join(' / ');
});

// A4 usable height in px (96px/in, 25.4mm/in), minus 24mm margins (12mm * 2)
const PORTRAIT_H_PX = ((297 - 24) / 25.4) * 96; // ~1032px
const LANDSCAPE_H_PX = ((210 - 24) / 25.4) * 96; // ~703px
// Header margin-bottom (see .cal-ph) plus slack against rounding.
const HEADER_GAP_PX = 10;
const SAFETY_PX = 4;
// Floor for the text of an event that does not fit its box even at the size the
// layout picked for it.
const MIN_FONT_PX = 6;

const calPhRef = ref<HTMLElement | null>(null);
const headRowRef = ref<HTMLElement | null>(null);
const allDayRowRef = ref<HTMLElement | null>(null);

const isPortrait = computed<boolean>(
  () => !data.value || data.value.days === 1,
);

const showPlanSplit = computed<boolean>(() => data.value?.plan === 'both');

const visibleDays = computed<string[]>(() => {
  if (!data.value) {
    return [];
  }
  const start = parseLocalDate(data.value.date);

  // Stepping the day-of-month keeps this correct across a DST change, which
  // adding 24h worth of milliseconds would not.
  return Array.from({ length: data.value.days }, (_, i) =>
    formatLocalDate(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    ),
  );
});

const settingsDayStartMinutes = computed<number>(
  () => (data.value && parseTimeToMinutes(data.value.dayStart)) || 0,
);

const settingsDayEndMinutes = computed<number>(
  () => (data.value && parseTimeToMinutes(data.value.dayEnd)) || 0,
);

// Expand the time range to ensure every timed event in the visible days is included.
const dayStartMinutes = computed<number>(() => {
  if (!data.value) {
    return 0;
  }
  const interval = data.value.interval;
  const min = visibleDays.value
    .flatMap((day) => getTimedEvents(day))
    .reduce(
      (acc, e) => Math.min(acc, parseTimeToMinutes(e.time!) ?? acc),
      settingsDayStartMinutes.value,
    );

  return Math.floor(min / interval) * interval;
});

const dayEndMinutes = computed<number>(() => {
  if (!data.value) {
    return 0;
  }
  const interval = data.value.interval;
  const max = visibleDays.value
    .flatMap((day) => getTimedEvents(day))
    .reduce(
      (acc, e) =>
        Math.max(acc, (parseTimeToMinutes(e.time!) ?? 0) + e.duration!),
      settingsDayEndMinutes.value,
    );

  return Math.ceil(max / interval) * interval;
});

const timeSlots = computed<TimeSlot[]>(() => {
  if (!data.value) {
    return [];
  }
  const slots: TimeSlot[] = [];
  for (
    let m = dayStartMinutes.value;
    m < dayEndMinutes.value;
    m += data.value.interval
  ) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push({
      minutes: m,
      text: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      isHour: min === 0,
      // Every other hour gets a faint wash, so a row can be tracked across a
      // seven-column sheet without a ruler.
      band: h % 2 === 1,
    });
  }

  return slots;
});

const slotHeight = ref<number>(28);

/**
 * Shrinks event text that does not fit its box: the meta line goes first, then
 * the font steps down. The starting size comes from the box height (set as
 * `--evt-fs` when the event is placed), so tall events keep readable type.
 */
function fitEventText() {
  const eventEls = document.querySelectorAll<HTMLElement>('.cal-print__event');
  eventEls.forEach((el) => {
    const body = el.querySelector<HTMLElement>('.cal-print__event__body');
    if (!body) {
      return;
    }
    // Undo what an earlier pass applied before measuring again.
    el.classList.remove('cal-print__event--clipped');
    body.style.fontSize = '';

    // subtract 1px top + 1px bottom padding from el
    const available = el.clientHeight - 2;
    let fontSize = parseFloat(getComputedStyle(body).fontSize);

    // The time and location line is the first thing to give: the position in
    // the grid already carries the time.
    if (body.scrollHeight > available) {
      el.classList.add('cal-print__event--clipped');
    }

    while (body.scrollHeight > available && fontSize > MIN_FONT_PX) {
      fontSize -= 0.5;
      body.style.fontSize = `${fontSize}px`;
    }
  });
}

function updateSlotHeight() {
  if (!timeSlots.value.length) {
    return;
  }
  const pageH = isPortrait.value ? PORTRAIT_H_PX : LANDSCAPE_H_PX;
  // Measure what is actually rendered — multi-line camp titles, wrapped all-day
  // chips and the A/B day header all change these heights.
  const headerH = (calPhRef.value?.offsetHeight ?? 55) + HEADER_GAP_PX;
  const gridOverhead =
    (headRowRef.value?.offsetHeight ?? 34) +
    (allDayRowRef.value?.offsetHeight ?? 0) +
    2; // grid border, top + bottom
  const available = pageH - headerH - gridOverhead - SAFETY_PX;

  slotHeight.value = Math.max(
    14,
    Math.min(52, Math.floor(available / timeSlots.value.length)),
  );
}

const eventsMap = computed<Record<string, ProgramEvent[]>>(() => {
  if (!data.value) {
    return {};
  }
  const plan = data.value.plan;
  return data.value.events
    .filter((e) => {
      if (!e.date) {
        return false;
      }
      if (plan === 'both') {
        return true;
      }
      return e.plan === plan || e.plan === 'both';
    })
    .reduce<Record<string, ProgramEvent[]>>((map, event) => {
      const key = event.date!;
      (map[key] ??= []).push(event);
      return map;
    }, {});
});

function getFullDayEvents(date: string): ProgramEvent[] {
  return (eventsMap.value[date] ?? []).filter((e) => !e.time);
}

function getTimedEvents(date: string): ProgramEvent[] {
  return (eventsMap.value[date] ?? []).filter(
    (e) => !!e.time && !!e.duration && parseTimeToMinutes(e.time) !== null,
  );
}

const hasAllDayEvents = computed<boolean>(() =>
  visibleDays.value.some((day) => getFullDayEvents(day).length > 0),
);

/** Places the timed events of one day and turns them into rendered boxes. */
function layoutFor(date: string): PlacedEvent[] {
  if (!data.value) {
    return [];
  }

  return layoutDayEvents(getTimedEvents(date), {
    dayStartMinutes: dayStartMinutes.value,
    interval: data.value.interval,
    slotHeight: slotHeight.value,
    splitPlans: showPlanSplit.value,
  }).map(toPlacedEvent);
}

function toPlacedEvent(box: EventBox): PlacedEvent {
  const { event, x0, x1 } = box;
  const time = formatMinutesAsTime(box.startMinutes);
  const location = toAll(event.location);
  const color = event.color ?? DEFAULT_EVENT_COLOR;

  return {
    id: event.id,
    title: toAll(event.title),
    time,
    meta: [`${time}–${formatMinutesAsTime(box.endMinutes)}`, location]
      .filter(Boolean)
      .join(' · '),
    compact: box.compact,
    style: {
      top: `${box.top}px`,
      height: `${box.height}px`,
      left: `calc(${x0 * 100}% + 1px)`,
      width: `calc(${(x1 - x0) * 100}% - 2px)`,
      backgroundColor: fillColor(color),
      borderLeftColor: color,
      '--evt-fs': `${box.fontSize}px`,
    },
  };
}

function chipStyle(event: ProgramEvent): Record<string, string> {
  const color = event.color ?? DEFAULT_EVENT_COLOR;

  return {
    backgroundColor: fillColor(color),
    borderLeftColor: color,
  };
}

// Returns all unique translation values across all locales
function toAll(value: Translatable | null | undefined): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }

  return [...new Set(Object.values(value).filter(Boolean))].join(' / ');
}

// Camp name per language, deduplicated, the camp's primary locale first.
const titleLines = computed<string[]>(() => {
  const name = data.value?.camp.name;
  if (!name) {
    return [];
  }
  if (typeof name === 'string') {
    return [name];
  }
  const ordered = [
    ...campLocales.value.map((l) => name[l]),
    ...Object.values(name),
  ].filter((line): line is string => !!line);

  return [...new Set(ordered)];
});

const planLabel = computed<string>(() => {
  if (!data.value) {
    return '';
  }

  const plan = data.value.plan;
  if (plan === 'both') {
    return '';
  }

  const key = plan === 'a' ? 'planA' : 'planB';
  const labels = campLocales.value.map((l) => t(key, {}, { locale: l }));

  return [...new Set(labels)].join(' / ');
});

const headerDateRange = computed<string>(() => {
  const days = visibleDays.value;
  if (!days.length) {
    return '';
  }

  const fmt = (s: string) =>
    parseLocalDate(s).toLocaleDateString(primaryLocale.value, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return days.length === 1
    ? fmt(days[0]!)
    : `${fmt(days[0]!)} – ${fmt(days[days.length - 1]!)}`;
});

function formatWeekday(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const labels = campLocales.value.map((l) =>
    date.toLocaleDateString(l, { weekday: 'short' }),
  );

  return [...new Set(labels)].join(' / ');
}

function formatDay(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString(primaryLocale.value, {
    day: 'numeric',
    month: 'short',
  });
}
</script>

<style lang="scss" scoped>
// Print sheets always render light (PrintLayout forces it) and have to survive
// a black-and-white printer, so these greys are fixed rather than themed.
$ink: #1a1a1a;
$ink-soft: #5c5c5c;
$ink-faint: #8a8a8a;
$rule: #c9c9c9;
$rule-soft: #e6e6e6;
$rule-hair: #f0f0f0;

.print-page {
  background: white;
}

// A4 usable widths: (paper_mm - 2*12mm margin) * 96px/25.4mm
.print-sheet {
  &--portrait {
    // portrait: 210mm - 24mm = 186mm ≈ 703px
    max-width: 703px;
    margin: 0 auto;
  }

  &--landscape {
    // landscape: 297mm - 24mm = 273mm ≈ 1032px
    max-width: 1032px;
    margin: 0 auto;
  }
}

// The sheet title sits above the grid on white — the grid's own top border is
// the horizontal line the eye needs, so the header carries none of its own.
.cal-ph {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 10px;

  &__titles {
    margin: 0;
    min-width: 0;
    // Every camp locale gets the name at the same weight — neither language is
    // a subtitle of the other.
    font-size: 17px;
    font-weight: 700;
    color: $ink;
    line-height: 1.2;
    letter-spacing: -0.3px;

    span {
      display: block;
    }
  }

  &__meta {
    flex-shrink: 0;
    text-align: right;
    white-space: nowrap;
  }

  &__range {
    font-size: 11px;
    font-weight: 600;
    color: $ink-soft;
    letter-spacing: 0.2px;
  }

  &__plan {
    margin-top: 1px;
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: $ink-faint;
  }
}

.cal-print {
  border: 1px solid $rule;
  border-radius: 4px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
  font-size: 10px;

  &__head-row,
  &__allday-row {
    display: flex;
  }

  // White, with one firm rule under it: a grey band this close to the sheet
  // title only adds weight, the typography already reads as a header.
  &__head-row {
    border-bottom: 1.25px solid $ink-soft;
  }

  &__allday-row {
    background: #fafafa;
    border-bottom: 1px solid $rule;
  }

  &__gutter {
    width: 40px;
    flex-shrink: 0;
    border-right: 1px solid $rule;

    &--allday {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 2px 4px;
      font-size: 7.5px;
      font-weight: 600;
      color: $ink-faint;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      text-align: right;
    }
  }

  &__day-head {
    flex: 1;
    min-width: 0;
    text-align: center;
    padding: 5px 3px 4px;
    border-right: 1px solid $rule-soft;

    &:last-child {
      border-right: none;
    }

    &__wd {
      font-weight: 700;
      font-size: 8.5px;
      color: $ink-faint;
      text-transform: uppercase;
      letter-spacing: 1.1px;
    }

    &__d {
      font-size: 12px;
      font-weight: 700;
      color: $ink;
      line-height: 1.2;
      letter-spacing: -0.2px;
    }

    &__ab {
      display: flex;
      margin-top: 3px;

      span {
        flex: 1;
        text-align: center;
        font-size: 7px;
        font-weight: 700;
        color: $ink-faint;
        letter-spacing: 1px;
      }

      // Picks up the dashed A/B divider that runs down the day column.
      span:first-child {
        border-right: 1px dashed $rule-soft;
      }
    }
  }

  &__allday-cell {
    flex: 1;
    min-width: 0;
    padding: 2px;
    border-right: 1px solid $rule-soft;

    &:last-child {
      border-right: none;
    }
  }

  &__chip {
    border-radius: 2px;
    border-left: 3px solid;
    padding: 1px 4px;
    margin-bottom: 2px;
    font-size: 8px;
    font-weight: 700;
    color: $ink;
    line-height: 1.25;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__body {
    display: flex;
  }

  &__time-label {
    height: var(--slot-h, 28px);
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 1px 4px 0 0;
    font-size: 8px;
    color: $ink-faint;
    box-sizing: border-box;
    border-top: 1px solid transparent;

    &--hour {
      color: $ink-soft;
      font-weight: 600;
      border-top-color: $rule-soft;
    }
  }

  &__day-cols {
    flex: 1;
    min-width: 0;
    display: flex;
  }

  &__day-col {
    flex: 1;
    min-width: 0;
    position: relative;
    border-right: 1px solid $rule-soft;

    &:last-child {
      border-right: none;
    }

    // Splits the column into the A (left) and B (right) halves.
    &--split::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      border-left: 1px dashed $rule-soft;
    }
  }

  &__slot {
    height: var(--slot-h, 28px);
    box-sizing: border-box;
    // Full hours carry the line, sub-divisions stay hairlines, so the eye reads
    // hours first. Driven by the slot data, so any interval works.
    border-top: 1px solid $rule-hair;

    &--hour {
      border-top-color: $rule;
    }

    &:first-child {
      border-top-color: transparent;
    }

    &--band {
      background: #fafafa;
    }
  }

  &__event {
    position: absolute;
    z-index: 1;
    border-radius: 2px;
    border-left: 3px solid;
    padding: 1px 3px;
    overflow: hidden;
    box-sizing: border-box;

    &__body {
      font-size: var(--evt-fs, 9px);
      line-height: 1.2;
    }

    &__title {
      font-weight: 700;
      color: $ink;
      overflow-wrap: anywhere;
    }

    &__meta {
      font-size: 0.85em;
      color: $ink-soft;
      overflow-wrap: anywhere;
    }

    &__time {
      font-weight: 600;
      color: $ink-soft;

      // Non-breaking, so the gap to the title survives white-space collapsing.
      &::after {
        content: '\00a0';
      }
    }

    // Boxes too small for the time and location line — the grid position
    // carries the time instead.
    &--clipped &__meta {
      display: none;
    }

    &--compact &__title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>

<style>
@page {
  margin: 12mm;
}

@media print {
  /* Prevent blank trailing page from Quasar layout wrappers */
  .q-layout,
  .q-page-container,
  .q-page {
    min-height: 0 !important;
    height: auto !important;
    padding: 0 !important;
  }

  .print-sheet {
    break-after: avoid;
    page-break-after: avoid;
    /* In print the browser clips to the page anyway — remove the screen max-width cap */
    max-width: none !important;
  }
}
</style>

<i18n lang="yaml" locale="en">
allDay: 'All day'
planA: 'Plan A'
planB: 'Plan B'
</i18n>

<i18n lang="yaml" locale="de">
allDay: 'Ganztägig'
planA: 'Plan A'
planB: 'Plan B'
</i18n>

<i18n lang="yaml" locale="fr">
allDay: 'Journée'
planA: 'Plan A'
planB: 'Plan B'
</i18n>

<i18n lang="yaml" locale="pl">
allDay: 'Cały dzień'
planA: 'Plan A'
planB: 'Plan B'
</i18n>

<i18n lang="yaml" locale="cs">
allDay: 'Celý den'
planA: 'Plán A'
planB: 'Plán B'
</i18n>
