<template>
  <div
    class="column"
    :class="quasar.platform.is.mobile ? 'reverse' : ''"
  >
    <q-resize-observer @resize="onResize" />

    <calendar-navigation-bar
      v-model="range"
      v-model:plan="activePlan"
      class="col-shrink"
      :start="props.camp.startAt"
      :end="props.camp.endAt"
      :current="selectedDate"
      @next="onNextNavigation"
      @previous="onPreciousNavigation"
      @jump="(date) => (selectedDate = date)"
      @print="onPrint"
      @settings="onSettingsOpen"
    />

    <div class="col relative-position">
      <q-calendar-day
        ref="calendarRef"
        v-model="selectedDate"
        view="day"
        :locale="locale"
        :drag-enter-func="onDragEnter"
        :drag-over-func="onDragOver"
        :drag-leave-func="onDragLeave"
        :drop-func="onDrop"
        :max-days="range"
        :interval-start="intervalStart"
        :interval-count="intervalCount"
        :interval-minutes="settings.timeInterval"
        :interval-height="intervalHeight"
        hour24-format
        time-clicks-clamped
        bordered
        hoverable
        animated
        :transition-next="range === 1 ? 'slide-left' : 'fade'"
        :transition-prev="range === 1 ? 'slide-right' : 'fade'"
        class="fit absolute"
        :style="{
          // This is a workaround as the calendar otherwise does not shrink
          maxWidth: maxWidth + 'px',
        }"
        @click-head-day="onDayEventAdd"
      >
        <template #head-day-event="{ scope: { timestamp } }">
          <div class="column">
            <div
              class="cal-day-actions"
              @click.stop
            >
              <q-btn
                v-if="range > 1"
                icon="zoom_in"
                flat
                round
                dense
                size="xs"
                @click.stop="onZoomToDay(timestamp.date)"
              >
                <q-tooltip>{{ t('actions.focusDay') }}</q-tooltip>
              </q-btn>
              <q-btn
                icon="print"
                flat
                round
                dense
                size="xs"
                @click.stop="onPrintDay(timestamp.date)"
              >
                <q-tooltip>{{ t('actions.printDay') }}</q-tooltip>
              </q-btn>
            </div>
            <calendar-day-item
              v-for="event in getFullDayEvents(timestamp.date)"
              :key="event.id"
              :event="event"
              :view-both="viewBoth"
              :draggable="true"
              @dragstart="(e: DragEvent) => onDragStart(e, event)"
              @edit="onEventEdit(event)"
              @delete="onEventDelete(event)"
              @duplicate="onEventDuplicate(event)"
            />
          </div>
        </template>

        <template
          #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }"
        >
          <!-- Drag-to-create overlay: sits behind events, handles empty-area clicks -->
          <div
            class="cal-create-overlay"
            :style="{ pointerEvents: isDraggingEvent ? 'none' : undefined }"
            @mousedown.left.prevent="
              (e) => onBodyMouseDown(e, timestamp, timeDurationHeight)
            "
          />

          <!-- Selection highlight while dragging to create -->
          <div
            v-if="dragSelection && dragSelection?.date === timestamp.date"
            class="cal-selection"
            :style="{
              top: `${(dragSelection.startMinutes - dragSelection.dayStartMinutes) * dragSelection.pxPerMinute}px`,
              height: `${(dragSelection.endMinutes - dragSelection.startMinutes) * dragSelection.pxPerMinute}px`,
            }"
          />

          <calendar-item
            v-for="event in getEvents(timestamp.date)"
            :key="event.id"
            :event="event"
            :time-start-position="timeStartPos"
            :time-duration-height="timeDurationHeight"
            :view-both="viewBoth"
            :draggable="true"
            :snap="settings.timeInterval"
            @dragstart="(e: DragEvent) => onDragStart(e, event)"
            @edit="onEventEdit(event)"
            @delete="onEventDelete(event)"
            @duplicate="onEventDuplicate(event)"
            @resize="(e) => onEventResize(event, e)"
          />
        </template>
      </q-calendar-day>
    </div>
  </div>
</template>

<script lang="ts" setup>
import '@quasar/quasar-ui-qcalendar/dist/index.css';
import { QCalendarDay, type Timestamp } from '@quasar/quasar-ui-qcalendar';
import { useI18n } from 'vue-i18n';
import type {
  CampDetails,
  ProgramEvent,
  ProgramEventCreateData,
  ProgramEventUpdateData,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import CalendarNavigationBar from 'components/campManagement/programPlanner/CalendarNavigationBar.vue';
import CalendarItem from 'components/campManagement/programPlanner/CalendarItem.vue';
import CalendarDayItem from 'components/campManagement/programPlanner/CalendarDayItem.vue';
import type { DragAndDropScope } from 'components/campManagement/programPlanner/DragAndDropScope';
import ProgramEventAddDialog from 'components/campManagement/programPlanner/dialogs/ProgramEventAddDialog.vue';
import ProgramEventEditDialog from 'components/campManagement/programPlanner/dialogs/ProgramEventEditDialog.vue';
import CalendarSettingsDialog from 'components/campManagement/programPlanner/dialogs/CalendarSettingsDialog.vue';
import { daysBetweenDates } from 'src/utils/date';

interface CalendarSettings {
  dayStart: string;
  dayEnd: string;
  timeInterval: number;
}

interface Props {
  camp: CampDetails;
  events: ProgramEvent[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update', id: string, event: ProgramEventUpdateData): void;
  (e: 'add', event: ProgramEventCreateData): void;
  (e: 'delete', id: string): void;
}>();

const { t, locale } = useI18n();
const quasar = useQuasar();

const calendarRef = ref<QCalendarDay | null>(null);
const selectedDate = ref<string>(initialSelectedDate());
const range = ref<number>(initialRange());
const activePlan = ref<'a' | 'b' | 'both'>('a');
const maxWidth = ref<number>();

const SETTINGS_KEY = 'program-planner-settings';

function loadSettings(): CalendarSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return {
        dayStart: '08:00',
        dayEnd: '21:00',
        timeInterval: 30,
        ...JSON.parse(stored),
      };
    }
  } catch {
    // ignore
  }
  return { dayStart: '08:00', dayEnd: '21:00', timeInterval: 30 };
}

const settings = reactive<CalendarSettings>(loadSettings());

watch(
  settings,
  () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings }));
  },
  { deep: true },
);

onMounted(() => {
  setTimeout(() => {
    updateIntervalHeight();
  }, 500);
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});

const eventTimeRange = computed<{
  minMinutes: number;
  maxMinutes: number;
} | null>(() => {
  let minMinutes = Infinity;
  let maxMinutes = -Infinity;

  for (const event of props.events) {
    if (!event.time) continue;
    const [h, m] = event.time.split(':').map(Number);
    const startMin = (h ?? 0) * 60 + (m ?? 0);
    const endMin = startMin + (event.duration ?? 60);
    if (startMin < minMinutes) minMinutes = startMin;
    if (endMin > maxMinutes) maxMinutes = endMin;
  }

  return minMinutes === Infinity ? null : { minMinutes, maxMinutes };
});

const intervalStart = computed<number>(() => {
  const start = settings.dayStart.split(':');
  if (start.length !== 2) {
    return 0;
  }
  let minutes = parseInt(start[0] ?? '0') * 60 + parseInt(start[1] ?? '0');

  if (eventTimeRange.value && eventTimeRange.value.minMinutes < minutes) {
    minutes =
      Math.floor(eventTimeRange.value.minMinutes / settings.timeInterval) *
      settings.timeInterval;
  }

  return minutes / settings.timeInterval;
});

const intervalCount = computed<number>(() => {
  const end = settings.dayEnd.split(':');
  if (end.length !== 2) {
    return 0;
  }
  let minutes = parseInt(end[0] ?? '0') * 60 + parseInt(end[1] ?? '0');

  if (eventTimeRange.value && eventTimeRange.value.maxMinutes > minutes) {
    minutes =
      Math.ceil(eventTimeRange.value.maxMinutes / settings.timeInterval) *
      settings.timeInterval;
  }

  return minutes / settings.timeInterval - intervalStart.value;
});

const intervalHeight = ref<number>(10);

watch(intervalCount, () => {
  updateIntervalHeight();
});

function onResize(size: { width: number; height: number }) {
  maxWidth.value = size.width;
  requestAnimationFrame(() => {
    updateIntervalHeight();
  });
}

function getCalendarElement() {
  return document.getElementsByClassName('q-calendar-day__body')[0];
}

function updateIntervalHeight() {
  const el = getCalendarElement();
  if (!el) {
    return;
  }

  const height = el.clientHeight - 10;
  intervalHeight.value = height / intervalCount.value;
}

function maxViewportRange(): number {
  switch (quasar.screen.name) {
    case 'xs':
      return 1;
    case 'sm':
      return 3;
    case 'md':
      return 5;
    case 'lg':
      return 7;
    case 'xl':
      return 10;
    default:
      return 1;
  }
}

function initialRange(): number {
  const max = daysBetweenDates(
    new Date(props.camp.startAt),
    new Date(props.camp.endAt),
  );

  return Math.min(max, maxViewportRange());
}

watch(
  () => quasar.screen.name,
  () => {
    range.value = initialRange();
  },
);

function initialSelectedDate(): string {
  return props.camp.startAt.substring(0, 10);
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-');
  return new Date(
    parseInt(y ?? '0'),
    parseInt(m ?? '0') - 1,
    parseInt(d ?? '0'),
  );
}

const viewBoth = computed<boolean>(() => activePlan.value === 'both');

const eventsMap = computed<Record<string, ProgramEvent[]>>(() => {
  return props.events
    .filter((event) => {
      if (event.date == null) return false;
      if (activePlan.value === 'both') return true;
      return event.plan === activePlan.value || event.plan === 'both';
    })
    .reduce(
      (map, event) => {
        if (!(event.date! in map)) {
          map[event.date!] = [];
        }
        map[event.date!]!.push(event);

        return map;
      },
      {} as Record<string, ProgramEvent[]>,
    );
});

function getFullDayEvents(date: string) {
  const events = eventsMap.value[date] || [];

  return events.filter((value) => !value.time);
}

function getEvents(date: string) {
  return eventsMap.value[date] || [];
}

interface CalendarEvent {
  event: PointerEvent;
  scope: {
    timestamp: Timestamp;
  };
}

function onDayEventAdd({ scope }: CalendarEvent) {
  quasar
    .dialog({
      component: ProgramEventAddDialog,
      componentProps: {
        date: scope.timestamp.date,
        time: null,
        duration: null,
        plan: activePlan.value === 'both' ? 'both' : activePlan.value,
        dateTimeMin: props.camp.startAt,
        dateTimeMax: props.camp.endAt,
        locales: props.camp.locales,
      },
    })
    .onOk((programEvent: ProgramEventCreateData) => {
      emit('add', programEvent);
    });
}

function onEventResize(event: ProgramEvent, duration: number) {
  emit('update', event.id, { duration });
}

function snapTime(time: string, intervalMinutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0);
  const snapped = Math.round(total / intervalMinutes) * intervalMinutes;
  return `${String(Math.floor(snapped / 60)).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function onEventDuplicate(event: ProgramEvent) {
  quasar
    .dialog({
      component: ProgramEventAddDialog,
      componentProps: {
        title: event.title,
        date: event.date,
        time: event.time ? addMinutesToTime(event.time, 30) : event.time,
        duration: event.duration,
        location: event.location,
        details: event.details,
        color: event.color,
        plan: event.plan,
        locales: props.camp.locales,
        dateTimeMin: props.camp.startAt,
        dateTimeMax: props.camp.endAt,
      },
    })
    .onOk((programEvent: ProgramEventCreateData) => {
      emit('add', programEvent);
    });
}

function onEventEdit(event: ProgramEvent) {
  quasar
    .dialog({
      component: ProgramEventEditDialog,
      componentProps: {
        event,
        dateTimeMin: props.camp.startAt,
        dateTimeMax: props.camp.endAt,
        locales: props.camp.locales,
      },
    })
    .onOk((programEvent: ProgramEventUpdateData) => {
      emit('update', event.id, programEvent);
    });
}

function onEventDelete(event: ProgramEvent) {
  quasar
    .dialog({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message'),
      cancel: {
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        color: 'negative',
        rounded: true,
      },
      persistent: true,
    })
    .onOk(() => {
      emit('delete', event.id);
    });
}

function onPrint() {
  const printData = {
    camp: {
      name: props.camp.name,
      startAt: props.camp.startAt,
      endAt: props.camp.endAt,
    },
    events: props.events,
    date: selectedDate.value,
    days: range.value,
    plan: activePlan.value,
    dayStart: settings.dayStart,
    dayEnd: settings.dayEnd,
    interval: settings.timeInterval,
  };
  const key = `print-calendar-${Date.now()}`;
  sessionStorage.setItem(key, JSON.stringify(printData));
  window.open(`/print/calendar?key=${encodeURIComponent(key)}`, '_blank');
}

function onZoomToDay(date: string) {
  selectedDate.value = date;
  range.value = 1;
}

function onPrintDay(date: string) {
  const printData = {
    camp: {
      name: props.camp.name,
      startAt: props.camp.startAt,
      endAt: props.camp.endAt,
    },
    events: props.events,
    date,
    days: 1,
    plan: activePlan.value,
    dayStart: settings.dayStart,
    dayEnd: settings.dayEnd,
    interval: settings.timeInterval,
  };
  const key = `print-calendar-${Date.now()}`;
  sessionStorage.setItem(key, JSON.stringify(printData));
  window.open(`/print/calendar?key=${encodeURIComponent(key)}`, '_blank');
}

function onSettingsOpen() {
  quasar
    .dialog({
      component: CalendarSettingsDialog,
      componentProps: {
        modelValue: { ...settings },
      },
    })
    .onOk((newSettings: CalendarSettings) => {
      Object.assign(settings, newSettings);
    });
}

let dragHighlightEl: Element | null = null;
const isDraggingEvent = ref(false);

interface DragSelection {
  date: string;
  startMinutes: number;
  endMinutes: number;
  pxPerMinute: number;
  dayStartMinutes: number;
  bodyEl: HTMLElement;
}
const dragSelection = ref<DragSelection | null>(null);

function onBodyMouseDown(
  e: MouseEvent,
  timestamp: Timestamp,
  timeDurationHeight: (d?: number) => number,
) {
  const bodyEl = e.currentTarget as HTMLElement;
  const pxPerMinute = timeDurationHeight(60) / 60;
  const dayStartMinutes = intervalStart.value * settings.timeInterval;

  const yToSnapped = (clientY: number) => {
    const y = clientY - bodyEl.getBoundingClientRect().top;
    const raw = y / pxPerMinute + dayStartMinutes;
    return Math.round(raw / settings.timeInterval) * settings.timeInterval;
  };

  const start = yToSnapped(e.clientY);
  dragSelection.value = {
    date: timestamp.date,
    startMinutes: start,
    endMinutes: start + settings.timeInterval,
    pxPerMinute,
    dayStartMinutes,
    bodyEl,
  };

  const onMove = (ev: MouseEvent) => {
    if (!dragSelection.value) return;
    const end = yToSnapped(ev.clientY);
    dragSelection.value = {
      ...dragSelection.value,
      endMinutes: Math.max(
        dragSelection.value.startMinutes + settings.timeInterval,
        end,
      ),
    };
  };

  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    if (!dragSelection.value) return;
    const { date, startMinutes, endMinutes } = dragSelection.value;
    dragSelection.value = null;
    const time = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`;
    quasar
      .dialog({
        component: ProgramEventAddDialog,
        componentProps: {
          date,
          time,
          duration: endMinutes - startMinutes,
          plan: activePlan.value === 'both' ? 'both' : activePlan.value,
          dateTimeMin: props.camp.startAt,
          dateTimeMax: props.camp.endAt,
          locales: props.camp.locales,
        },
      })
      .onOk((programEvent: ProgramEventCreateData) => {
        emit('add', programEvent);
      });
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function clearDragHighlight() {
  dragHighlightEl?.classList.remove('droppable');
  dragHighlightEl = null;
}

function onDragStart(e: DragEvent, event: ProgramEvent): void {
  if (!e.dataTransfer) {
    return;
  }

  e.dataTransfer.effectAllowed = 'copyMove';
  e.dataTransfer.setData('eventId', event.id);

  isDraggingEvent.value = true;
  const onDragEnd = () => {
    isDraggingEvent.value = false;
    document.removeEventListener('dragend', onDragEnd);
  };
  document.addEventListener('dragend', onDragEnd);
}

function onDragEnter(e: DragEvent): boolean {
  e.preventDefault();
  // Direct DOM manipulation avoids Vue reactivity re-renders on every cell hover
  if (
    e.currentTarget instanceof Element &&
    dragHighlightEl !== e.currentTarget
  ) {
    clearDragHighlight();
    dragHighlightEl = e.currentTarget;
    dragHighlightEl.classList.add('droppable');
  }
  return false;
}

function onDragOver(e: DragEvent): boolean {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = e.ctrlKey || e.metaKey ? 'copy' : 'move';
  }
  return false;
}

function onDragLeave(e: DragEvent): boolean {
  if (e.currentTarget instanceof Element) {
    e.currentTarget.classList.remove('droppable');
    if (dragHighlightEl === e.currentTarget) {
      dragHighlightEl = null;
    }
  }
  return false;
}

function onDrop(
  e: DragEvent,
  type: string,
  { scope }: { scope: DragAndDropScope },
): boolean {
  clearDragHighlight();
  const eventId = e.dataTransfer?.getData('eventId');
  if (!eventId) {
    return false;
  }

  const event = props.events.find((value) => value.id === eventId);
  if (!event) {
    return false;
  }

  let eventUpdate: ProgramEventUpdateData;
  switch (type) {
    case 'interval':
      eventUpdate = {
        date: scope.timestamp.date,
        time: snapTime(scope.timestamp.time, settings.timeInterval),
        duration: event.duration ?? 60,
      };
      break;
    case 'head-day':
      eventUpdate = {
        date: scope.timestamp.date,
        time: null,
        duration: null,
      };
      break;
    default:
      eventUpdate = {
        date: null,
        time: null,
        duration: null,
      };
  }

  if (e.ctrlKey || e.metaKey) {
    emit('add', {
      title: event.title,
      location: event.location,
      details: event.details,
      color: event.color,
      plan: event.plan,
      ...eventUpdate,
    } as ProgramEventCreateData);
  } else {
    emit('update', eventId, eventUpdate);
  }

  return false;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function onKeydown(e: KeyboardEvent) {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  ) {
    return;
  }
  if (e.key === 'ArrowRight') {
    onNextNavigation();
  } else if (e.key === 'ArrowLeft') {
    onPreciousNavigation();
  }
}

function onNextNavigation() {
  const endDate = parseLocalDate(props.camp.endAt.substring(0, 10));
  const currentDate = parseLocalDate(selectedDate.value);

  const rangeMs = range.value * DAY_IN_MS;
  const maxTime = endDate.getTime() - (rangeMs - DAY_IN_MS);
  const updateMs = Math.min(maxTime, currentDate.getTime() + rangeMs);

  selectedDate.value = formatDate(new Date(updateMs));
}

function onPreciousNavigation() {
  const startDate = parseLocalDate(props.camp.startAt.substring(0, 10));
  const currentDate = parseLocalDate(selectedDate.value);

  const rangeMs = range.value * DAY_IN_MS;
  const minTime = currentDate.getTime() - rangeMs;
  const updateMs = Math.max(startDate.getTime(), minTime);

  selectedDate.value = formatDate(new Date(updateMs));
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
</script>

<style lang="scss">
.droppable {
  box-shadow: inset 0 0 0 1px rgba(0, 140, 200, 0.8);
}

.cal-create-overlay {
  position: absolute;
  inset: 0;
  cursor: cell;
  z-index: 0;
}

.cal-day-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0;
  opacity: 0.4;
  transition: opacity 0.15s;

  &:hover {
    opacity: 1;
  }
}

.cal-selection {
  position: absolute;
  left: 2px;
  right: 2px;
  background-color: rgba(33, 150, 243, 0.15);
  border: 1px solid rgba(33, 150, 243, 0.5);
  border-radius: 3px;
  pointer-events: none;
  z-index: 1;
}
</style>

<i18n lang="yaml" locale="en">
dialog:
  delete:
    title: 'Delete Event'
    message: 'Are you sure you want to delete this event?'
actions:
  focusDay: 'Show this day only'
  printDay: 'Print this day'
</i18n>

<i18n lang="yaml" locale="de">
dialog:
  delete:
    title: 'Ereignis löschen'
    message: 'Sind Sie sicher, dass Sie dieses Ereignis löschen möchten?'
actions:
  focusDay: 'Nur diesen Tag anzeigen'
  printDay: 'Diesen Tag drucken'
</i18n>

<i18n lang="yaml" locale="fr">
dialog:
  delete:
    title: "Supprimer l'événement"
    message: 'Êtes-vous sûr de vouloir supprimer cet événement ?'
actions:
  focusDay: 'Afficher ce jour uniquement'
  printDay: 'Imprimer ce jour'
</i18n>
