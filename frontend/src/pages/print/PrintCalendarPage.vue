<template>
  <div
    v-if="data"
    class="print-sheet"
    :class="isPortrait ? 'print-sheet--upright' : 'print-sheet--left'"
  >
    <!-- Page header -->
    <div class="cal-ph">
      <div class="cal-ph__title">
        <div
          v-for="line in titleLines"
          :key="line"
        >
          {{ line }}
        </div>
      </div>
      <div class="cal-ph__meta">{{ headerDateRange }} &middot; {{ planLabel }}</div>
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
          {{ t('allDay') }}
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
              <div class="cal-print__event__time">{{ event.time }}</div>
              <div class="cal-print__event__title">{{ toAll(event.title) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
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

// A4 usable height in px (96px/in, 25.4mm/in), minus 24mm margins
const PORTRAIT_H_PX = ((297 - 24) / 25.4) * 96; // ~1032px
const LANDSCAPE_H_PX = ((210 - 24) / 25.4) * 96; // ~703px
// Measured overhead: cal-ph (~55px) + col-headers (~32px) + allday-row (~25px)
// + borders (~2px) + safety margin (26px) = 140px
const OVERHEAD_PX = 140;

const data = ref<PrintData | null>(null);

onMounted(() => {
  const key = route.query.key as string;
  if (!key) return;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      data.value = JSON.parse(raw) as PrintData;
      setTimeout(() => sessionStorage.removeItem(key), 5000);
    }
  } catch {
    // ignore parse errors
  }
  setTimeout(() => window.print(), 400);
});

const isPortrait = computed<boolean>(() => !data.value || data.value.days === 1);

const visibleDays = computed<string[]>(() => {
  if (!data.value) return [];
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

const dayStartMinutes = computed<number>(() => {
  if (!data.value) return 0;
  const [h, m] = data.value.dayStart.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
});

const dayEndMinutes = computed<number>(() => {
  if (!data.value) return 0;
  const [h, m] = data.value.dayEnd.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
});

const timeSlots = computed<TimeSlot[]>(() => {
  if (!data.value) return [];
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

// Compute slot height so the entire grid fits on one page
const slotHeight = computed<number>(() => {
  if (!timeSlots.value.length) return 28;
  const pageH = isPortrait.value ? PORTRAIT_H_PX : LANDSCAPE_H_PX;
  const available = pageH - OVERHEAD_PX;
  return Math.max(14, Math.min(50, Math.floor(available / timeSlots.value.length)));
});

const eventsMap = computed<Record<string, ProgramEvent[]>>(() => {
  if (!data.value) return {};
  const plan = data.value.plan;
  return data.value.events
    .filter((e) => {
      if (!e.date) return false;
      if (plan === 'both') return true;
      return e.plan === plan || e.plan === 'both';
    })
    .reduce(
      (map, event) => {
        const key = event.date!;
        if (!map[key]) map[key] = [];
        map[key].push(event);
        return map;
      },
      {} as Record<string, ProgramEvent[]>,
    );
});

function getFullDayEvents(date: string): ProgramEvent[] {
  return (eventsMap.value[date] ?? []).filter((e) => !e.time);
}

function getTimedEvents(date: string): ProgramEvent[] {
  return (eventsMap.value[date] ?? []).filter((e) => !!e.time && !!e.duration);
}

function eventStyle(event: ProgramEvent) {
  if (!data.value || !event.time || !event.duration) return {};
  const [h, m] = event.time.split(':').map(Number);
  const startMins = (h ?? 0) * 60 + (m ?? 0);
  const offset = startMins - dayStartMinutes.value;
  const sh = slotHeight.value;
  const intervalMin = data.value.interval;
  const top = (offset / intervalMin) * sh;
  const height = Math.max((event.duration / intervalMin) * sh, sh);

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
  if (!value) return '';
  if (typeof value === 'string') return value;
  return [...new Set(Object.values(value).filter(Boolean))].join(' / ');
}

// Camp name as one line per language (deduplicated)
const titleLines = computed<string[]>(() => {
  const name = data.value?.camp.name;
  if (!name) return [];
  if (typeof name === 'string') return [name];
  return [...new Set(Object.values(name).filter(Boolean))];
});

const planLabel = computed(() => {
  if (!data.value) return '';
  return { a: 'Plan A', b: 'Plan B', both: 'Plan A + B' }[data.value.plan];
});

const headerDateRange = computed(() => {
  const days = visibleDays.value;
  if (!days.length) return '';
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y!, m! - 1, d).toLocaleDateString(locale.value, {
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
  return new Date(y!, m! - 1, d).toLocaleDateString(locale.value, {
    weekday: 'short',
  });
}

function formatDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y!, m! - 1, d).toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
  });
}

</script>

<style lang="scss" scoped>
.cal-ph {
  margin-bottom: 10px;

  &__title {
    font-size: 24px;
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
      font-size: 9px;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.2;
    }

    &__title {
      font-size: 12px;
      font-weight: 700;
      color: white;
      line-height: 1.25;
    }
  }
}
</style>

<style>
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
  }
}
</style>

<i18n lang="yaml" locale="en">
allDay: 'All day'
</i18n>

<i18n lang="yaml" locale="de">
allDay: 'Ganztägig'
</i18n>

<i18n lang="yaml" locale="fr">
allDay: 'Journée'
</i18n>
