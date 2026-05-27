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
      :class="isPortrait ? 'print-sheet--upright' : 'print-sheet--left'"
    >
      <!-- Page header -->
      <div
        ref="calPhRef"
        class="cal-ph"
      >
        <div class="cal-ph__title">
          <div
            v-for="line in titleLines"
            :key="line"
          >
            {{ line }}
          </div>
        </div>
        <div class="cal-ph__meta">
          {{ headerDateRange }}{{ planLabel ? ` · ${planLabel}` : '' }}
        </div>
      </div>

      <!-- Calendar grid -->
      <div
        class="cal-print"
        :style="{ '--slot-h': `${slotHeight}px` }"
      >
        <!-- Day header row -->
        <div class="cal-print__head-row">
          <div class="cal-print__gutter" />
          <div
            v-for="day in visibleDays"
            :key="day"
            class="cal-print__day-head"
          >
            <div class="cal-print__day-head__wd">{{ formatWeekday(day) }}</div>
            <div class="cal-print__day-head__d">{{ formatDay(day) }}</div>
            <div
              v-if="data.plan === 'both'"
              class="cal-print__day-head__ab"
            >
              <span>A</span>
              <span>B</span>
            </div>
          </div>
        </div>

        <!-- All-day events row -->
        <div class="cal-print__allday-row">
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
              class="cal-print__allday-event"
              :style="{ backgroundColor: event.color ?? '#2196F3' }"
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
            >
              <div
                v-for="slot in timeSlots"
                :key="slot.minutes"
                class="cal-print__slot"
              />
              <div
                v-for="event in getTimedEvents(day)"
                :key="event.id"
                class="cal-print__event"
                :style="eventStyle(event)"
              >
                <div class="cal-print__event__title">
                  <span class="cal-print__event__time">{{ event.time }} · </span
                  >{{ toAll(event.title) }}
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
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
}

const route = useRoute();
const { locale, t } = useI18n();

const data = ref<PrintData | null>(null);
const error = ref<string | null>(null);

const storageKey = computed<string>(() => {
  const key = (route.query.key as string | undefined)?.trim();
  return key && key.length > 0 ? key : 'print:calendar:payload';
});

function postToParent(msg: unknown) {
  try {
    window.parent?.postMessage(msg, window.location.origin);
  } catch {
    // ignore
  }
}

function cleanupSessionStorage() {
  try {
    sessionStorage.removeItem(storageKey.value);
  } catch {
    // ignore
  }
}

async function waitForFonts() {
  const anyDoc = document as unknown as { fonts?: { ready?: Promise<void> } };
  if (anyDoc.fonts?.ready) {
    try {
      await anyDoc.fonts.ready;
    } catch {
      // ignore
    }
  }
}

async function waitForStableLayout() {
  await nextTick();
  await waitForFonts();
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}

function triggerPrint() {
  postToParent({ type: 'PRINT_CALENDAR:PRINTING' });
  window.print();
}

function onAfterPrint() {
  cleanupSessionStorage();
  postToParent({ type: 'PRINT_CALENDAR:AFTERPRINT' });
}

onBeforeUnmount(() => {
  window.removeEventListener('afterprint', onAfterPrint);
  window.removeEventListener('beforeprint', fitEventText);
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
// Overhead within cal-print that is NOT the body: head-row + allday-row + borders
const CAL_GRID_OVERHEAD_PX = 85;

const calPhRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  window.addEventListener('afterprint', onAfterPrint);
  window.addEventListener('beforeprint', fitEventText);

  const raw = sessionStorage.getItem(storageKey.value);
  if (!raw) {
    error.value =
      'No print payload found. Please start the export from the management page.';
    postToParent({ type: 'PRINT_CALENDAR:ERROR', error: error.value });
    return;
  }

  try {
    data.value = JSON.parse(raw) as PrintData;
  } catch {
    error.value = 'Failed to parse print payload.';
    postToParent({ type: 'PRINT_CALENDAR:ERROR', error: error.value });
    return;
  }

  postToParent({ type: 'PRINT_CALENDAR:LOADED' });

  // First pass: template renders with data, calPhRef becomes available
  await waitForStableLayout();
  updateSlotHeight();
  // Second pass: --slot-h CSS variable has been applied, slots have correct heights
  await waitForStableLayout();
  fitEventText();

  postToParent({ type: 'PRINT_CALENDAR:READY' });

  triggerPrint();
});

const isPortrait = computed<boolean>(
  () => !data.value || data.value.days === 1,
);

const visibleDays = computed<string[]>(() => {
  if (!data.value) {
    return [];
  }
  const [y, m, d] = data.value.date.split('-').map(Number);
  const start = new Date(y!, m! - 1, d);
  return Array.from({ length: data.value.days }, (_, i) => {
    const day = new Date(start.getTime() + i * 86400000);
    return toDateStr(day);
  });
});

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const settingsDayStartMinutes = computed<number>(() => {
  if (!data.value) {
    return 0;
  }
  const [h, m] = data.value.dayStart.split(':').map(Number);

  return (h ?? 0) * 60 + (m ?? 0);
});

const settingsDayEndMinutes = computed<number>(() => {
  if (!data.value) {
    return 0;
  }
  const [h, m] = data.value.dayEnd.split(':').map(Number);

  return (h ?? 0) * 60 + (m ?? 0);
});

// Expand the time range to ensure every timed event in the visible days is included.
const dayStartMinutes = computed<number>(() => {
  if (!data.value) {
    return 0;
  }
  const interval = data.value.interval;
  const plan = data.value.plan;
  const daySet = new Set(visibleDays.value);
  const min = data.value.events
    .filter(
      (e) =>
        e.time &&
        e.date &&
        daySet.has(e.date) &&
        (plan === 'both' || e.plan === plan || e.plan === 'both'),
    )
    .reduce((acc, e) => {
      const [h, m] = (e.time as string).split(':').map(Number);

      return Math.min(acc, (h ?? 0) * 60 + (m ?? 0));
    }, settingsDayStartMinutes.value);

  return Math.floor(min / interval) * interval;
});

const dayEndMinutes = computed<number>(() => {
  if (!data.value) {
    return 0;
  }

  const interval = data.value.interval;
  const plan = data.value.plan;
  const daySet = new Set(visibleDays.value);
  const max = data.value.events
    .filter(
      (e) =>
        e.time &&
        e.duration &&
        e.date &&
        daySet.has(e.date) &&
        (plan === 'both' || e.plan === plan || e.plan === 'both'),
    )
    .reduce((acc, e) => {
      const [h, m] = (e.time as string).split(':').map(Number);

      return Math.max(acc, (h ?? 0) * 60 + (m ?? 0) + (e.duration as number));
    }, settingsDayEndMinutes.value);

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
    });
  }

  return slots;
});

const slotHeight = ref<number>(28);

function fitEventText() {
  const eventEls = document.querySelectorAll<HTMLElement>('.cal-print__event');
  eventEls.forEach((el) => {
    const title = el.querySelector<HTMLElement>('.cal-print__event__title');
    if (!title) {
      return;
    }
    // subtract 1px top + 1px bottom padding from el
    const availableHeight = el.clientHeight - 2;
    // start proportional to available space so tall events get larger text
    let fontSize = Math.min(
      13,
      Math.max(6, Math.floor(availableHeight * 0.45)),
    );
    title.style.fontSize = `${fontSize}px`;
    while (title.scrollHeight > availableHeight && fontSize > 6) {
      fontSize -= 0.5;
      title.style.fontSize = `${fontSize}px`;
    }
  });
}

function updateSlotHeight() {
  if (!timeSlots.value.length) {
    return;
  }
  const pageH = isPortrait.value ? PORTRAIT_H_PX : LANDSCAPE_H_PX;
  // Measure the actual rendered header height so multi-line titles are handled correctly.
  const phHeight = (calPhRef.value?.offsetHeight ?? 55) + 10; // +10 for margin-bottom
  const available = pageH - phHeight - CAL_GRID_OVERHEAD_PX;
  slotHeight.value = Math.max(
    14,
    Math.min(50, Math.floor(available / timeSlots.value.length)),
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
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(event);
      return map;
    }, {});
});

function getFullDayEvents(date: string): ProgramEvent[] {
  return (eventsMap.value[date] ?? []).filter((e) => !e.time);
}

function getTimedEvents(date: string): ProgramEvent[] {
  return (eventsMap.value[date] ?? []).filter((e) => !!e.time && !!e.duration);
}

function eventStyle(event: ProgramEvent) {
  if (!data.value || !event.time || !event.duration) {
    return {};
  }
  const [h, m] = event.time.split(':').map(Number);
  const startMins = (h ?? 0) * 60 + (m ?? 0);
  const offset = startMins - dayStartMinutes.value;
  const sh = slotHeight.value;
  const intervalMin = data.value.interval;
  const top = (offset / intervalMin) * sh;
  const height = (event.duration / intervalMin) * sh;

  let left = '1px';
  let width = 'calc(100% - 5px)';
  if (data.value.plan === 'both' && event.plan !== 'both') {
    width = 'calc(50% - 5px)';
    if (event.plan === 'b') left = '50%';
  }

  return {
    top: `${top}px`,
    height: `${height}px`,
    left,
    width,
    backgroundColor: event.color ?? '#2196F3',
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

// Camp name as one line per language (deduplicated)
const titleLines = computed<string[]>(() => {
  const name = data.value?.camp.name;
  if (!name) {
    return [];
  }
  if (typeof name === 'string') {
    return [name];
  }

  return [...new Set(Object.values(name).filter(Boolean))];
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
  const labels = campLocales.value.map((l) => t(key, l));
  return [...new Set(labels)].join(' / ');
});

const headerDateRange = computed(() => {
  const days = visibleDays.value;
  if (!days.length) {
    return '';
  }

  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y!, m! - 1, d).toLocaleDateString(primaryLocale.value, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  return days.length === 1
    ? fmt(days[0]!)
    : `${fmt(days[0]!)} – ${fmt(days[days.length - 1]!)}`;
});

function formatWeekday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y!, m! - 1, d);
  const labels = campLocales.value.map((l) =>
    date.toLocaleDateString(l, { weekday: 'short' }),
  );
  return [...new Set(labels)].join(' / ');
}

function formatDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y!, m! - 1, d).toLocaleDateString(primaryLocale.value, {
    day: 'numeric',
    month: 'short',
  });
}
</script>

<style lang="scss" scoped>
.print-page {
  background: white;
}

// A4 usable widths: (paper_mm - 2*12mm margin) * 96px/25.4mm
.print-sheet {
  &--upright {
    // portrait: 210mm - 24mm = 186mm ≈ 703px
    max-width: 703px;
    margin: 0 auto;
  }

  &--left {
    // landscape: 297mm - 24mm = 273mm ≈ 1032px
    max-width: 1032px;
    margin: 0 auto;
  }
}

.cal-ph {
  margin-bottom: 10px;

  &__title {
    font-size: 16px;
    font-weight: 800;
    color: #212121;
    line-height: 1.15;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  &__meta {
    font-size: 11px;
    color: #757575;
  }
}

.cal-print {
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
  font-size: 10px;

  &__head-row,
  &__allday-row {
    display: flex;
    border-bottom: 1px solid #e0e0e0;
  }

  &__gutter {
    width: 46px;
    flex-shrink: 0;
    border-right: 1px solid #e0e0e0;

    &--allday {
      font-size: 8px;
      color: #9e9e9e;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 4px;
    }
  }

  &__day-head {
    flex: 1;
    text-align: center;
    padding: 5px 2px;
    border-right: 1px solid #e0e0e0;
    background: #f5f5f5;

    &:last-child {
      border-right: none;
    }

    &__wd {
      font-weight: 700;
      font-size: 10px;
      color: #424242;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    &__d {
      font-size: 9px;
      color: #757575;
    }

    &__ab {
      display: flex;
      margin-top: 3px;
      padding-top: 2px;
      border-top: 1px solid #d0d0d0;

      span {
        flex: 1;
        text-align: center;
        font-size: 8px;
        font-weight: 700;
        color: #9e9e9e;
        letter-spacing: 0.5px;
      }
    }
  }

  &__allday-cell {
    flex: 1;
    min-height: 20px;
    padding: 2px;
    border-right: 1px solid #e0e0e0;

    &:last-child {
      border-right: none;
    }
  }

  &__allday-event {
    border-radius: 2px;
    border-left: 3px solid rgba(0, 0, 0, 0.2);
    padding: 1px 4px;
    font-size: 8px;
    font-weight: 600;
    color: white;
    margin-bottom: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__body {
    display: flex;
  }

  &__time-label {
    height: var(--slot-h, 28px);
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding-right: 4px;
    padding-top: 2px;
    font-size: 8px;
    color: #9e9e9e;
    box-sizing: border-box;
  }

  &__day-cols {
    flex: 1;
    display: flex;
  }

  &__day-col {
    flex: 1;
    position: relative;
    border-right: 1px solid #e0e0e0;

    &:last-child {
      border-right: none;
    }
  }

  &__slot {
    height: var(--slot-h, 28px);
    border-bottom: 1px solid #f0f0f0;
    box-sizing: border-box;

    &:nth-child(2n) {
      border-bottom-color: #e0e0e0;
    }
  }

  &__event {
    position: absolute;
    border-radius: 2px;
    border-left: 3px solid rgba(0, 0, 0, 0.2);
    padding: 1px 3px;
    overflow: hidden;
    box-sizing: border-box;

    &__time {
      font-size: 0.8em;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.8);
    }

    &__title {
      font-size: 11px;
      font-weight: 700;
      color: white;
      line-height: 1.2;
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
