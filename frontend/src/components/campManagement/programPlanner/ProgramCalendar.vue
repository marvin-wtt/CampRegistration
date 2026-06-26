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
      :start="camp.startAt"
      :end="camp.endAt"
      :current="selectedDate"
      :editable="canUpdate"
      :deletable="canDelete"
      :creatable="canCreate"
      @next="onNextNavigation"
      @previous="onPreviousNavigation"
      @jump="(date) => (selectedDate = date)"
      @print="onPrint"
      @settings="onSettingsOpen"
    />

    <div
      class="col row no-wrap"
      style="min-height: 0"
    >
      <div class="col relative-position">
        <div class="absolute fit">
          <q-calendar-day
            ref="calendarRef"
            class="fit"
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
            :interval-class="outOfCampIntervalClass"
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
                  :show-all-translations="settings.showAllTranslations"
                  :selected="event.id === selectedEventId"
                  :draggable="canDrag"
                  :editable="canUpdate"
                  :deletable="canDelete"
                  :creatable="canCreate"
                  @click.stop="selectedEventId = event.id"
                  @dragstart="(e: DragEvent) => onDragStart(e, event)"
                  @edit="onEventEdit(event)"
                  @delete="onEventDelete(event)"
                  @duplicate="onEventDuplicate(event)"
                  @move-to-backlog="onMoveToBacklog(event.id)"
                />
              </div>
            </template>

            <template
              #day-body="{
                scope: { timestamp, timeStartPos, timeDurationHeight },
              }"
            >
              <!-- Drag-to-create overlay: sits behind events, handles empty-area clicks -->
              <div
                class="cal-create-overlay"
                :class="{ 'cal-create-overlay--readonly': !canCreate }"
                :style="{ pointerEvents: isDraggingEvent ? 'none' : undefined }"
                @mousedown.left.prevent="
                  (e) => {
                    selectedEventId = null;
                    canCreate &&
                      !quasar.platform.is.mobile &&
                      onBodyMouseDown(e, timestamp, timeDurationHeight);
                  }
                "
                @click="
                  (e) => {
                    selectedEventId = null;
                    canCreate &&
                      quasar.platform.is.mobile &&
                      onBodyClick(e, timestamp, timeDurationHeight);
                  }
                "
              />

              <!-- Drop preview while dragging an existing event -->
              <div
                v-if="
                  dragHoverPreview && dragHoverPreview.date === timestamp.date
                "
                class="cal-drop-preview"
                :style="{
                  top: `${timeStartPos(dragHoverPreview.startTime) || 0}px`,
                  height: `${timeDurationHeight(dragHoverPreview.duration)}px`,
                  backgroundColor: hexToRgba(dragHoverPreview.color, 0.2),
                  borderColor: hexToRgba(dragHoverPreview.color, 0.7),
                  ...dragPreviewSideStyle,
                }"
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
                :show-all-translations="settings.showAllTranslations"
                :selected="event.id === selectedEventId"
                :draggable="canDrag"
                :editable="canUpdate"
                :deletable="canDelete"
                :creatable="canCreate"
                :snap="settings.timeInterval"
                @click.stop="selectedEventId = event.id"
                @dragstart="(e: DragEvent) => onDragStart(e, event)"
                @edit="onEventEdit(event)"
                @delete="onEventDelete(event)"
                @duplicate="onEventDuplicate(event)"
                @move-to-backlog="onMoveToBacklog(event.id)"
                @resize="(e) => onEventResize(event, e)"
              />
            </template>
          </q-calendar-day>
        </div>
      </div>

      <calendar-backlog-panel
        :events="backlogEvents"
        :active-plan="activePlan"
        :show-all-translations="settings.showAllTranslations"
        :editable="canUpdate"
        :deletable="canDelete"
        :creatable="canCreate"
        @add="onBacklogAdd"
        @edit="onEventEdit"
        @delete="onEventDelete"
        @duplicate="onEventDuplicate"
        @schedule="onScheduleFromBacklog"
        @dragstart="
          (e: DragEvent, event: ProgramEvent) => onDragStart(e, event)
        "
        @move-to-backlog="onMoveToBacklog"
      />
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import CalendarNavigationBar from 'components/campManagement/programPlanner/CalendarNavigationBar.vue';
import CalendarItem from 'components/campManagement/programPlanner/CalendarItem.vue';
import CalendarDayItem from 'components/campManagement/programPlanner/CalendarDayItem.vue';
import type { DragAndDropScope } from 'components/campManagement/programPlanner/DragAndDropScope';
import type { CalendarSettings } from 'components/campManagement/programPlanner/CalendarSettings';
import ProgramEventAddDialog from 'components/campManagement/programPlanner/dialogs/ProgramEventAddDialog.vue';
import ProgramEventEditDialog from 'components/campManagement/programPlanner/dialogs/ProgramEventEditDialog.vue';
import CalendarSettingsDialog from 'components/campManagement/programPlanner/dialogs/CalendarSettingsDialog.vue';
import CalendarBacklogPanel from 'components/campManagement/programPlanner/CalendarBacklogPanel.vue';
import { daysBetweenDates } from 'src/utils/date';
import { openPrintIframe } from 'src/utils/printIframe';
import { useCampStorage } from 'src/composables/campStorage';
import { usePermissions } from 'src/composables/permissions';

const { t, locale } = useI18n();
const quasar = useQuasar();
const { can } = usePermissions();

const canCreate = computed<boolean>(() => can('camp.program_events.create'));
const canUpdate = computed<boolean>(() => can('camp.program_events.update'));
const canDelete = computed<boolean>(() => can('camp.program_events.delete'));
// Moving an event is an update; copy-dragging (Ctrl/⌘) is a create.
const canDrag = computed<boolean>(() => canUpdate.value || canCreate.value);

const { camp, events } = defineProps<{
  camp: CampDetails;
  events: ProgramEvent[];
}>();

const emit = defineEmits<{
  (e: 'update', id: string, event: ProgramEventUpdateData): void;
  (e: 'add', event: ProgramEventCreateData): void;
  (e: 'delete', id: string): void;
}>();

const calendarRef = ref<QCalendarDay | null>(null);
const selectedDate = ref<string>(initialSelectedDate());
const range = ref<number>(initialRange());
const activePlan = ref<'a' | 'b' | 'both'>('both');

const settings = useCampStorage<CalendarSettings>('program-planner-settings', {
  dayStart: '08:00',
  dayEnd: '21:00',
  timeInterval: 30,
  showAllTranslations: false,
});

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

  for (const event of events) {
    if (!event.time) {
      continue;
    }
    const [h, m] = event.time.split(':').map(Number);
    const startMin = (h ?? 0) * 60 + (m ?? 0);
    const endMin = startMin + (event.duration ?? 60);
    if (startMin < minMinutes) {
      minMinutes = startMin;
    }
    if (endMin > maxMinutes) {
      maxMinutes = endMin;
    }
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

function onResize() {
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

  const count = intervalCount.value;
  if (!Number.isFinite(count) || count <= 0) {
    return;
  }
  const height = Math.max(0, el.clientHeight - 10);
  intervalHeight.value = Math.max(10, height / count);
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
  const max =
    daysBetweenDates(new Date(camp.startAt), new Date(camp.endAt)) + 1;

  return Math.min(max, maxViewportRange());
}

watch(
  () => quasar.screen.name,
  () => {
    range.value = initialRange();
  },
);

function initialSelectedDate(): string {
  return camp.startAt.substring(0, 10);
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
  return events
    .filter((event) => {
      if (event.date == null) {
        return false;
      }

      if (activePlan.value === 'both') {
        return true;
      }

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

const backlogEvents = computed<ProgramEvent[]>(() =>
  events.filter((e) => e.date == null),
);

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
  if (!canCreate.value) {
    return;
  }
  quasar
    .dialog({
      component: ProgramEventAddDialog,
      componentProps: {
        date: scope.timestamp.date,
        time: null,
        duration: null,
        plan: activePlan.value,
        dateTimeMin: camp.startAt,
        dateTimeMax: camp.endAt,
        locales: camp.locales,
      },
    })
    .onOk((programEvent: ProgramEventCreateData) => {
      emit('add', programEvent);
    });
}

function onEventResize(event: ProgramEvent, duration: number) {
  if (!canUpdate.value) {
    return;
  }
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
  if (!canCreate.value) {
    return;
  }
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
        locales: camp.locales,
        dateTimeMin: camp.startAt,
        dateTimeMax: camp.endAt,
      },
    })
    .onOk((programEvent: ProgramEventCreateData) => {
      emit('add', programEvent);
    });
}

function onEventEdit(event: ProgramEvent) {
  if (!canUpdate.value) {
    return;
  }
  quasar
    .dialog({
      component: ProgramEventEditDialog,
      componentProps: {
        event,
        dateTimeMin: camp.startAt,
        dateTimeMax: camp.endAt,
        locales: camp.locales,
      },
    })
    .onOk((programEvent: ProgramEventUpdateData) => {
      emit('update', event.id, programEvent);
    });
}

function onBacklogAdd() {
  if (!canCreate.value) {
    return;
  }
  quasar
    .dialog({
      component: ProgramEventAddDialog,
      componentProps: {
        plan: activePlan.value === 'both' ? 'both' : activePlan.value,
        dateTimeMin: camp.startAt,
        dateTimeMax: camp.endAt,
        locales: camp.locales,
      },
    })
    .onOk((programEvent: ProgramEventCreateData) => {
      emit('add', programEvent);
    });
}

function onMoveToBacklog(id: string) {
  if (!canUpdate.value) {
    return;
  }
  // Dropping on the backlog removes the dragged item from the calendar DOM,
  // which can suppress its `dragend` event — clear lingering drag state here.
  clearDragHighlight();
  cancelPreviewUpdate(null);
  isDraggingEvent.value = false;
  emit('update', id, { date: null, time: null });
}

function onScheduleFromBacklog(event: ProgramEvent) {
  if (!canUpdate.value) {
    return;
  }
  emit('update', event.id, {
    date: selectedDate.value,
    time: null,
    duration: null,
  });
}

function onEventDelete(event: ProgramEvent) {
  if (!canDelete.value) {
    return;
  }
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

function printCalendar(date: string, days: number) {
  const printData = {
    camp: {
      name: camp.name,
      startAt: camp.startAt,
      endAt: camp.endAt,
      locales: camp.locales,
    },
    events: events,
    date,
    days,
    plan: activePlan.value,
    dayStart: settings.dayStart,
    dayEnd: settings.dayEnd,
    interval: settings.timeInterval,
  };

  const key = `print:calendar:${Date.now()}`;
  sessionStorage.setItem(key, JSON.stringify(printData));

  // 703px = A4 portrait usable width, 1032px = A4 landscape usable width (96 dpi, 12mm margins).
  // Real dimensions are required so offsetHeight/clientHeight measurements in the print page work.
  const widthPx = days === 1 ? 703 : 1032;
  openPrintIframe(`/print/calendar?key=${encodeURIComponent(key)}`, {
    messagePrefix: 'PRINT_CALENDAR',
    widthPx,
    heightPx: 1123, // A4 height at 96 dpi
    onError: (error) => {
      quasar.notify({ type: 'negative', message: error });
    },
  });
}

function onPrint() {
  printCalendar(selectedDate.value, range.value);
}

function onZoomToDay(date: string) {
  selectedDate.value = date;
  range.value = 1;
}

function onPrintDay(date: string) {
  printCalendar(date, 1);
}

function onSettingsOpen() {
  quasar
    .dialog({
      component: CalendarSettingsDialog,
      componentProps: {
        settings: { ...settings },
      },
    })
    .onOk((newSettings: CalendarSettings) => {
      Object.assign(settings, newSettings);
    });
}

let dragHighlightEl: Element | null = null;
const isDraggingEvent = ref(false);

interface DragHoverPreview {
  date: string;
  startTime: string;
  duration: number;
  color: string;
  plan: 'a' | 'b' | 'both';
}

const dragHoverPreview = ref<DragHoverPreview | null>(null);
let draggingEventDuration = 60;
let draggingEventColor = '#2196F3';
let draggingEventPlan: 'a' | 'b' | 'both' = 'both';
let draggingGrabOffset = 0;

// Mirror CalendarItem's side placement: in both-plans view, a single-plan
// event occupies the left (a) or right (b) half of the column.
const dragPreviewSideStyle = computed(() => {
  const preview = dragHoverPreview.value;
  if (!preview || !viewBoth.value || preview.plan === 'both') {
    return {};
  }
  return preview.plan === 'b'
    ? { left: 'calc(50% + 2px)', right: 'auto', width: 'calc(50% - 4px)' }
    : { left: '2px', right: 'auto', width: 'calc(50% - 4px)' };
});

let previewRafId: number | null = null;
let pendingPreview: DragHoverPreview | null | undefined = undefined;

function schedulePreviewUpdate(preview: DragHoverPreview | null) {
  pendingPreview = preview;
  if (previewRafId === null) {
    previewRafId = requestAnimationFrame(() => {
      previewRafId = null;
      if (pendingPreview !== undefined) {
        dragHoverPreview.value = pendingPreview;
        pendingPreview = undefined;
      }
    });
  }
}

function cancelPreviewUpdate(immediate: DragHoverPreview | null) {
  if (previewRafId !== null) {
    cancelAnimationFrame(previewRafId);
    previewRafId = null;
  }
  pendingPreview = undefined;
  dragHoverPreview.value = immediate;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  if (!canCreate.value) {
    return;
  }
  const bodyEl = e.currentTarget as HTMLElement;
  const pxPerMinute = timeDurationHeight(60) / 60;
  const dayStartMinutes = intervalStart.value * settings.timeInterval;

  const yToSnapped = (clientY: number, roundFn = Math.round) => {
    const y = clientY - bodyEl.getBoundingClientRect().top;
    const raw = y / pxPerMinute + dayStartMinutes;

    return roundFn(raw / settings.timeInterval) * settings.timeInterval;
  };

  const start = yToSnapped(e.clientY, Math.floor);
  dragSelection.value = {
    date: timestamp.date,
    startMinutes: start,
    endMinutes: start + settings.timeInterval,
    pxPerMinute,
    dayStartMinutes,
    bodyEl,
  };

  const onMove = (ev: MouseEvent) => {
    if (!dragSelection.value) {
      return;
    }
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
    if (!dragSelection.value) {
      return;
    }
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
          dateTimeMin: camp.startAt,
          dateTimeMax: camp.endAt,
          locales: camp.locales,
        },
      })
      .onOk((programEvent: ProgramEventCreateData) => {
        emit('add', programEvent);
      });
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function onBodyClick(
  e: MouseEvent,
  timestamp: Timestamp,
  timeDurationHeight: (d?: number) => number,
) {
  if (!canCreate.value) {
    return;
  }
  const bodyEl = e.currentTarget as HTMLElement;
  const pxPerMinute = timeDurationHeight(60) / 60;
  const dayStartMinutes = intervalStart.value * settings.timeInterval;
  const y = e.clientY - bodyEl.getBoundingClientRect().top;
  const raw = y / pxPerMinute + dayStartMinutes;
  const snapped =
    Math.floor(raw / settings.timeInterval) * settings.timeInterval;
  const time = `${String(Math.floor(snapped / 60)).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`;

  quasar
    .dialog({
      component: ProgramEventAddDialog,
      componentProps: {
        date: timestamp.date,
        time,
        duration: settings.timeInterval,
        plan: activePlan.value === 'both' ? 'both' : activePlan.value,
        dateTimeMin: camp.startAt,
        dateTimeMax: camp.endAt,
        locales: camp.locales,
      },
    })
    .onOk((programEvent: ProgramEventCreateData) => {
      emit('add', programEvent);
    });
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
  e.dataTransfer.setData('text/plain', event.id);

  draggingEventDuration = event.duration ?? 60;
  draggingEventColor = event.color ?? '#2196F3';
  draggingEventPlan = event.plan;
  draggingGrabOffset =
    parseInt(e.dataTransfer.getData('text/grab-offset')) || 0;

  isDraggingEvent.value = true;
  const onDragEnd = () => {
    isDraggingEvent.value = false;
    cancelPreviewUpdate(null);
    // Drops outside the calendar (e.g. the backlog) never fire the calendar's
    // drop/leave handlers, so clear any lingering cell highlight here.
    clearDragHighlight();
    document.removeEventListener('dragend', onDragEnd);
  };
  document.addEventListener('dragend', onDragEnd);
}

function onDragEnter(
  e: DragEvent,
  type: string,
  { scope }: { scope: DragAndDropScope },
): boolean {
  e.preventDefault();
  if (type === 'interval') {
    const [h, m] = scope.timestamp.time.split(':').map(Number);
    const rawMinutes = (h ?? 0) * 60 + (m ?? 0) - draggingGrabOffset;
    const snapped =
      Math.round(Math.max(0, rawMinutes) / settings.timeInterval) *
      settings.timeInterval;
    const startTime = `${String(Math.floor(snapped / 60)).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`;
    schedulePreviewUpdate({
      date: scope.timestamp.date,
      startTime,
      duration: draggingEventDuration,
      color: draggingEventColor,
      plan: draggingEventPlan,
    });
  } else {
    schedulePreviewUpdate(null);
    // Direct DOM manipulation avoids Vue reactivity re-renders on every cell hover
    if (
      e.currentTarget instanceof Element &&
      dragHighlightEl !== e.currentTarget
    ) {
      clearDragHighlight();
      dragHighlightEl = e.currentTarget;
      dragHighlightEl.classList.add('droppable');
    }
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
  cancelPreviewUpdate(null);
  const eventId = e.dataTransfer?.getData('text/plain');
  if (!eventId) {
    return false;
  }

  const event = events.find((value) => value.id === eventId);
  if (!event) {
    return false;
  }

  let eventUpdate: ProgramEventUpdateData;
  switch (type) {
    case 'interval': {
      const grabOffsetMinutes =
        parseInt(e.dataTransfer?.getData('text/grab-offset') ?? '0') || 0;
      const [dh, dm] = scope.timestamp.time.split(':').map(Number);
      const adjustedMinutes = Math.max(
        0,
        (dh ?? 0) * 60 + (dm ?? 0) - grabOffsetMinutes,
      );
      const adjustedTime = `${String(Math.floor(adjustedMinutes / 60) % 24).padStart(2, '0')}:${String(adjustedMinutes % 60).padStart(2, '0')}`;
      eventUpdate = {
        date: scope.timestamp.date,
        time: snapTime(adjustedTime, settings.timeInterval),
        duration: event.duration ?? 60,
      };
      break;
    }
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
    if (!canCreate.value) {
      return false;
    }
    emit('add', {
      title: event.title,
      location: event.location,
      details: event.details,
      color: event.color,
      plan: event.plan,
      ...eventUpdate,
    } as ProgramEventCreateData);
  } else {
    if (!canUpdate.value) {
      return false;
    }
    emit('update', eventId, eventUpdate);
  }

  return false;
}

function localDateTimeParts(isoString: string): { date: string; time: string } {
  const dt = new Date(isoString);
  return {
    date: formatDate(dt),
    time: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
  };
}

function outOfCampIntervalClass({
  scope,
}: {
  scope: { timestamp: Timestamp };
}): Record<string, boolean> {
  const { date, time } = scope.timestamp;
  const start = localDateTimeParts(camp.startAt);
  const end = localDateTimeParts(camp.endAt);

  const outside =
    date < start.date ||
    (date === start.date && time < start.time) ||
    date > end.date ||
    (date === end.date && time >= end.time);

  return { 'cal-outside-camp': outside };
}

const selectedEventId = ref<string | null>(null);

type UndoEntry =
  | { type: 'update'; id: string; data: ProgramEventUpdateData }
  | { type: 'delete'; eventData: ProgramEventCreateData };

const undoStack: UndoEntry[] = [];

function pushUndo(entry: UndoEntry) {
  undoStack.push(entry);
  if (undoStack.length > 20) {
    undoStack.shift();
  }
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function onKeydown(e: KeyboardEvent) {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  ) {
    return;
  }
  if (e.key === 'Escape') {
    selectedEventId.value = null;
  } else if (e.key === 'ArrowRight') {
    onNextNavigation();
  } else if (e.key === 'ArrowLeft') {
    onPreviousNavigation();
  } else if (e.key === 'p') {
    if (!canUpdate.value) {
      return;
    }
    const event = events.find((ev) => ev.id === selectedEventId.value);
    if (event) {
      pushUndo({ type: 'update', id: event.id, data: { plan: event.plan } });
      const nextPlan =
        event.plan === 'both' ? 'a' : event.plan === 'a' ? 'b' : 'both';
      emit('update', event.id, { plan: nextPlan });
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!canDelete.value) {
      return;
    }
    const event = events.find((ev) => ev.id === selectedEventId.value);
    if (event) {
      pushUndo({
        type: 'delete',
        eventData: {
          title: event.title,
          date: event.date,
          time: event.time,
          duration: event.duration,
          location: event.location,
          details: event.details,
          color: event.color,
          plan: event.plan,
        },
      });
      selectedEventId.value = null;
      emit('delete', event.id);
    }
  } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    const entry = undoStack[undoStack.length - 1];
    if (entry?.type === 'update' && !canUpdate.value) {
      return;
    }
    if (entry?.type === 'delete' && !canCreate.value) {
      return;
    }
    undoStack.pop();
    if (entry?.type === 'update') {
      emit('update', entry.id, entry.data);
    } else if (entry?.type === 'delete') {
      emit('add', entry.eventData);
    }
  }
}

function onNextNavigation() {
  const endDate = parseLocalDate(camp.endAt.substring(0, 10));
  const currentDate = parseLocalDate(selectedDate.value);

  const rangeMs = range.value * DAY_IN_MS;
  const maxTime = endDate.getTime() - (rangeMs - DAY_IN_MS);
  const updateMs = Math.min(maxTime, currentDate.getTime() + rangeMs);

  selectedDate.value = formatDate(new Date(updateMs));
}

function onPreviousNavigation() {
  const startDate = parseLocalDate(camp.startAt.substring(0, 10));
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
.q-calendar {
  --calendar-current-color-dark: var(--md3-outline-variant);
  --calendar-mini-range-connector-color-dark: var(--md3-outline-variant);
  --calendar-mini-range-firstlast-label-background-dark: var(
    --md3-outline-variant
  );
  --calendar-border: var(--md3-outline-variant) 1px solid;
  --calendar-border-dark: var(--md3-outline-variant) 1px solid;
  --calendar-border-current-dark: var(--md3-outline-variant) 2px solid;
  --calendar-border-section-dark: var(--md3-outline-variant) 1px dashed;
  --calendar-mini-range-connector-hover-border-dark: var(--md3-primary) 1px
    dashed;
  --calendar-active-date-background: var(--md3-primary);
  --calendar-active-date-color: white;
  --calendar-active-date-background-dark: var(--md3-primary-container);
}

.droppable {
  box-shadow: inset 0 0 0 1px var(--md3-primary);
  background: color-mix(in srgb, var(--md3-primary) 8%, transparent);
}

.cal-create-overlay {
  position: absolute;
  inset: 0;
  cursor: cell;
  z-index: 0;

  &--readonly {
    cursor: default;
  }
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

  @media (hover: none) {
    opacity: 1;
  }
}

.cal-selection {
  position: absolute;
  left: 2px;
  right: 2px;
  background-color: color-mix(in srgb, var(--md3-primary) 12%, transparent);
  border: 1px solid var(--md3-primary);
  border-radius: 6px;
  pointer-events: none;
  z-index: 1;
}

.cal-drop-preview {
  position: absolute;
  left: 2px;
  right: 2px;
  border: 2px dashed;
  border-radius: 6px;
  pointer-events: none;
  z-index: 1;
}

// Diagonal hatching marks hours outside the camp period as unavailable;
// derived from on-surface so it adapts to both light and dark themes
.cal-outside-camp {
  background: repeating-linear-gradient(
    -45deg,
    color-mix(in srgb, var(--md3-on-surface) 4%, transparent),
    color-mix(in srgb, var(--md3-on-surface) 4%, transparent) 4px,
    color-mix(in srgb, var(--md3-on-surface) 10%, transparent) 4px,
    color-mix(in srgb, var(--md3-on-surface) 10%, transparent) 8px
  );
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

<i18n lang="yaml" locale="pl">
dialog:
  delete:
    title: 'Usuń wydarzenie'
    message: 'Czy na pewno chcesz usunąć to wydarzenie?'
actions:
  focusDay: 'Pokaż tylko ten dzień'
  printDay: 'Drukuj ten dzień'
</i18n>

<i18n lang="yaml" locale="cs">
dialog:
  delete:
    title: 'Smazat událost'
    message: 'Opravdu chcete smazat tuto událost?'
actions:
  focusDay: 'Zobrazit pouze tento den'
  printDay: 'Vytisknout tento den'
</i18n>
