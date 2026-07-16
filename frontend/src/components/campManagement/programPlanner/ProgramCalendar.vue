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
      :current="anchorDate"
      :restrict-to-camp="!settings.browseOutsideCampDates"
      :editable="canUpdate"
      :deletable="canDelete"
      :creatable="canCreate"
      @next="onNextNavigation"
      @previous="onPreviousNavigation"
      @jump="(date) => (anchorDate = date)"
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
            no-active-date
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
            :weekday-class="anchorWeekdayClass"
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
                  :selected="isSelected(event.id)"
                  :dimmed="dimmedEventIds.has(event.id)"
                  :draggable="canDrag"
                  :editable="canUpdate"
                  :deletable="canDelete"
                  :creatable="canCreate"
                  @click.stop="selectEvent(event.id, $event)"
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
                :class="{
                  'cal-create-overlay--readonly':
                    !canCreate || selectedEventIds.size > 0,
                }"
                :style="{ pointerEvents: isDraggingEvent ? 'none' : undefined }"
                @mousedown.left.prevent="
                  (e) => onOverlayMouseDown(e, timestamp, timeDurationHeight)
                "
                @click="(e) => onOverlayClick(e, timestamp, timeDurationHeight)"
                @mousemove="
                  (e) => onBodyMouseMove(e, timestamp, timeDurationHeight)
                "
                @mouseleave="onBodyMouseLeave"
              />

              <!-- Hover highlight showing the slot a click would create an
                   event in -->
              <div
                v-if="hoverSlot && hoverSlot.date === timestamp.date"
                class="cal-hover-slot"
                :style="{
                  top: `${(hoverSlot.startMinutes - hoverSlot.dayStartMinutes) * hoverSlot.pxPerMinute}px`,
                  height: `${(hoverSlot.endMinutes - hoverSlot.startMinutes) * hoverSlot.pxPerMinute}px`,
                }"
              />

              <!-- Drop preview while dragging an existing event (one box per
                   event when dragging a multi-selection) -->
              <div
                v-for="preview in dragHoverPreview.filter(
                  (p) => p.date === timestamp.date,
                )"
                :key="preview.id"
                class="cal-drop-preview"
                :style="{
                  top: `${timeStartPos(preview.startTime) || 0}px`,
                  height: `${timeDurationHeight(preview.duration)}px`,
                  backgroundColor: hexToRgba(preview.color, 0.2),
                  borderColor: hexToRgba(preview.color, 0.7),
                  ...previewSideStyle(preview),
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
                :selected="isSelected(event.id)"
                :dimmed="dimmedEventIds.has(event.id)"
                :draggable="canDrag"
                :editable="canUpdate"
                :deletable="canDelete"
                :creatable="canCreate"
                :snap="settings.timeInterval"
                @click.stop="selectEvent(event.id, $event)"
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
import { QCalendarDay } from '@quasar/quasar-ui-qcalendar';
import { type Timestamp } from '@timestamp-js/core';
import { useI18n } from 'vue-i18n';
import type {
  CampDetails,
  ProgramEvent,
  ProgramEventCreateData,
  ProgramEventUpdateData,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import CalendarNavigationBar from '@/components/campManagement/programPlanner/CalendarNavigationBar.vue';
import CalendarItem from '@/components/campManagement/programPlanner/CalendarItem.vue';
import CalendarDayItem from '@/components/campManagement/programPlanner/CalendarDayItem.vue';
import type { DragAndDropScope } from '@/components/campManagement/programPlanner/DragAndDropScope';
import type { ProgramPlannerSettings } from '@camp-registration/common/settings';
import ProgramEventAddDialog from '@/components/campManagement/programPlanner/dialogs/ProgramEventAddDialog.vue';
import ProgramEventEditDialog from '@/components/campManagement/programPlanner/dialogs/ProgramEventEditDialog.vue';
import CalendarSettingsDialog from '@/components/campManagement/programPlanner/dialogs/CalendarSettingsDialog.vue';
import CalendarBacklogPanel from '@/components/campManagement/programPlanner/CalendarBacklogPanel.vue';
import { daysBetweenDates, parseTimeToMinutes } from '@/utils/date';
import { openPrintIframe } from '@/utils/printIframe';
import { useCampSettings } from '@/composables/campSettings';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { usePermissions } from '@/composables/permissions';

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

const { settings } = useCampSettings<ProgramPlannerSettings>(
  SETTING_KEYS.PROGRAM_PLANNER,
  {
    dayStart: '08:00',
    dayEnd: '21:00',
    timeInterval: 30,
    showAllTranslations: false,
    browseOutsideCampDates: false,
  },
);

const calendarRef = ref<QCalendarDay | null>(null);
const range = ref<number>(initialRange());
const anchorDate = ref<string>(initialAnchorDate());
const selectedDate = computed<string>({
  get: () => clampWindowStart(anchorDate.value, range.value),
  set: (value) => {
    anchorDate.value = value;
  },
});
const activePlan = ref<'a' | 'b' | 'both'>('both');

let bodyResizeObserver: ResizeObserver | null = null;

onMounted(() => {
  observeCalendarBody();
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('click', onGlobalClick);
});

onUnmounted(() => {
  bodyResizeObserver?.disconnect();
  bodyResizeObserver = null;
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('click', onGlobalClick);
});

// The row height depends on the measured height of the calendar body. A
// ResizeObserver on that element fires as soon as it has a real, laid-out
// height (and again on every later size change) — replacing the fixed
// startup delay that guessed when layout was done.
function observeCalendarBody() {
  const el = getCalendarElement();
  if (!el) {
    // Body not in the DOM yet — retry on the next frame.
    requestAnimationFrame(observeCalendarBody);
    return;
  }

  bodyResizeObserver?.disconnect();
  bodyResizeObserver = new ResizeObserver(() => {
    updateIntervalHeight();
  });
  bodyResizeObserver.observe(el);
}

// Clicking anywhere that isn't an event (blank calendar space, the nav bar,
// the backlog, ...) clears the selection — events handle deselecting
// themselves via `selectEvent`, this covers everywhere else with the mouse.
function onGlobalClick(e: MouseEvent) {
  if (selectedEventIds.value.size === 0) {
    return;
  }
  const target = e.target;
  if (
    target instanceof Element &&
    target.closest('.cal-event, .cal-day-event')
  ) {
    return;
  }
  clearSelection();
}

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

function initialAnchorDate(): string {
  const startDate = parseLocalDate(camp.startAt.substring(0, 10));
  const endDate = parseLocalDate(camp.endAt.substring(0, 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today < startDate || today > endDate) {
    return formatDate(startDate);
  }

  return formatDate(today);
}

function clampWindowStart(date: string, days: number): string {
  if (settings.browseOutsideCampDates) {
    return date;
  }

  const startMs = parseLocalDate(camp.startAt.substring(0, 10)).getTime();
  const endMs = parseLocalDate(camp.endAt.substring(0, 10)).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const maxStartMs = endMs - (days - 1) * dayMs;
  const pickedMs = parseLocalDate(date).getTime();

  return formatDate(
    new Date(Math.max(startMs, Math.min(pickedMs, maxStartMs))),
  );
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
  pushUndo([
    { type: 'update', id: event.id, data: { duration: event.duration } },
  ]);
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
  resetDragState();

  const ids = selectionGroup(id);
  const actions: UndoAction[] = [];
  for (const eventId of ids) {
    const other = events.find((v) => v.id === eventId);
    if (other) {
      actions.push({
        type: 'update',
        id: eventId,
        data: { date: other.date, time: other.time },
      });
    }
    emit('update', eventId, { date: null, time: null });
  }
  pushUndo(actions);
}

function onScheduleFromBacklog(event: ProgramEvent) {
  if (!canUpdate.value) {
    return;
  }
  emit('update', event.id, {
    date: anchorDate.value,
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
    .onOk((newSettings: ProgramPlannerSettings) => {
      Object.assign(settings, newSettings);
    });
}

let dragHighlightEl: Element | null = null;
const isDraggingEvent = ref(false);

// The full set of ids being dragged together (the selection, when the
// dragged event is part of one; otherwise just that event). Ctrl/cmd held
// during the drag means "copy the single dragged event" instead, so the
// rest of the group stays put and shouldn't be hidden or previewed.
const draggingGroupIds = ref<Set<string>>(new Set());
const isCopyDragActive = ref(false);

// Events other than the one actually under the cursor that should be hidden
// while dragging — their destination is represented by the drop preview
// boxes instead, so showing both would look like two copies of each event.
const dimmedEventIds = computed<Set<string>>(() => {
  if (isCopyDragActive.value || draggingGroupIds.value.size === 0) {
    return new Set();
  }
  const ids = new Set(draggingGroupIds.value);
  if (draggingEventId) {
    ids.delete(draggingEventId);
  }
  return ids;
});

interface DragHoverPreview {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  color: string;
  plan: 'a' | 'b' | 'both';
}

const dragHoverPreview = ref<DragHoverPreview[]>([]);
let draggingEventId: string | null = null;
let draggingEventDuration = 60;
let draggingEventColor = '#2196F3';
let draggingEventPlan: 'a' | 'b' | 'both' = 'both';
let draggingGrabOffset = 0;

// Mirror CalendarItem's side placement: in both-plans view, a single-plan
// event occupies the left (a) or right (b) half of the column.
function previewSideStyle(preview: DragHoverPreview) {
  if (!viewBoth.value || preview.plan === 'both') {
    return {};
  }
  return preview.plan === 'b'
    ? { left: 'calc(50% + 2px)', right: 'auto', width: 'calc(50% - 4px)' }
    : { left: '2px', right: 'auto', width: 'calc(50% - 4px)' };
}

let previewRafId: number | null = null;
let pendingPreview: DragHoverPreview[] | undefined = undefined;

function schedulePreviewUpdate(preview: DragHoverPreview[]) {
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

function cancelPreviewUpdate(immediate: DragHoverPreview[]) {
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

// A click on blank space while something is selected just clears the
// selection — it must not also open the create dialog, or deselecting
// becomes a trap that accidentally schedules a new event.
function onOverlayMouseDown(
  e: MouseEvent,
  timestamp: Timestamp,
  timeDurationHeight: (d?: number) => number,
) {
  const hadSelection = selectedEventIds.value.size > 0;
  clearSelection();
  if (hadSelection || !canCreate.value || quasar.platform.is.mobile) {
    return;
  }
  onBodyMouseDown(e, timestamp, timeDurationHeight);
}

function onOverlayClick(
  e: MouseEvent,
  timestamp: Timestamp,
  timeDurationHeight: (d?: number) => number,
) {
  const hadSelection = selectedEventIds.value.size > 0;
  clearSelection();
  if (hadSelection || !canCreate.value || !quasar.platform.is.mobile) {
    return;
  }
  onBodyClick(e, timestamp, timeDurationHeight);
}

function onBodyMouseDown(
  e: MouseEvent,
  timestamp: Timestamp,
  timeDurationHeight: (d?: number) => number,
) {
  if (!canCreate.value) {
    return;
  }
  hoverSlot.value = null;
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

interface HoverSlot {
  date: string;
  startMinutes: number;
  endMinutes: number;
  dayStartMinutes: number;
  pxPerMinute: number;
}

// Highlights the exact interval a click would create an event in — desktop
// only, since there's no persistent hover state on touch devices.
const hoverSlot = ref<HoverSlot | null>(null);

function onBodyMouseMove(
  e: MouseEvent,
  timestamp: Timestamp,
  timeDurationHeight: (d?: number) => number,
) {
  if (
    !canCreate.value ||
    quasar.platform.is.mobile ||
    dragSelection.value ||
    isDraggingEvent.value ||
    selectedEventIds.value.size > 0
  ) {
    hoverSlot.value = null;
    return;
  }

  const bodyEl = e.currentTarget as HTMLElement;
  const pxPerMinute = timeDurationHeight(60) / 60;
  const dayStartMinutes = intervalStart.value * settings.timeInterval;
  const y = e.clientY - bodyEl.getBoundingClientRect().top;
  const raw = y / pxPerMinute + dayStartMinutes;
  const start = Math.floor(raw / settings.timeInterval) * settings.timeInterval;

  hoverSlot.value = {
    date: timestamp.date,
    startMinutes: start,
    endMinutes: start + settings.timeInterval,
    dayStartMinutes,
    pxPerMinute,
  };
}

function onBodyMouseLeave() {
  hoverSlot.value = null;
}

function clearDragHighlight() {
  dragHighlightEl?.classList.remove('droppable');
  dragHighlightEl = null;
}

// A drop that changes an event's date moves it into a different day cell's
// (or the backlog's) v-for list, which can cause Vue to unmount/remount the
// dragged element's DOM node before the native `dragend` event fires on it —
// silently suppressing that event. Drop handlers must call this themselves
// rather than rely solely on the `dragend` listener below.
function resetDragState() {
  isDraggingEvent.value = false;
  draggingEventId = null;
  draggingGroupIds.value = new Set();
  isCopyDragActive.value = false;
  cancelPreviewUpdate([]);
  clearDragHighlight();
}

function onDragStart(e: DragEvent, event: ProgramEvent): void {
  if (!e.dataTransfer) {
    return;
  }

  e.dataTransfer.effectAllowed = 'copyMove';
  e.dataTransfer.setData('text/plain', event.id);

  draggingEventId = event.id;
  draggingGroupIds.value = new Set(selectionGroup(event.id));
  isCopyDragActive.value = false;
  draggingEventDuration = event.duration ?? 60;
  draggingEventColor = event.color ?? '#2196F3';
  draggingEventPlan = event.plan;
  draggingGrabOffset =
    parseInt(e.dataTransfer.getData('text/grab-offset')) || 0;

  isDraggingEvent.value = true;
  const onDragEnd = () => {
    resetDragState();
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
  const isCopy = e.ctrlKey || e.metaKey;
  if (isCopyDragActive.value !== isCopy) {
    isCopyDragActive.value = isCopy;
  }
  if (type === 'interval') {
    const time = scope.timestamp.time ?? '';
    const [h, m] = time.split(':').map(Number);
    const rawMinutes = (h ?? 0) * 60 + (m ?? 0) - draggingGrabOffset;
    const snapped =
      Math.round(Math.max(0, rawMinutes) / settings.timeInterval) *
      settings.timeInterval;
    const startTime = `${String(Math.floor(snapped / 60)).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`;

    const previews: DragHoverPreview[] = [
      {
        id: draggingEventId ?? '',
        date: scope.timestamp.date,
        startTime,
        duration: draggingEventDuration,
        color: draggingEventColor,
        plan: draggingEventPlan,
      },
    ];

    // Preview the rest of the selection too, offset the same way the drop
    // will move (or copy) them, so the whole group's destination is visible
    // while dragging — not just the event under the cursor.
    if (draggingEventId) {
      const draggedEvent = events.find((v) => v.id === draggingEventId);
      const groupIds = draggedEvent
        ? selectionGroup(draggingEventId).filter((id) => id !== draggingEventId)
        : [];

      if (draggedEvent?.date && groupIds.length > 0) {
        const dayDelta = daysBetweenDates(
          parseLocalDate(draggedEvent.date),
          parseLocalDate(scope.timestamp.date),
        );
        const minuteDelta = draggedEvent.time
          ? parseTimeToMinutes(startTime)! -
            parseTimeToMinutes(draggedEvent.time)!
          : null;

        for (const id of groupIds) {
          const other = events.find((v) => v.id === id);
          if (!other?.date || !other.time) {
            continue;
          }
          const otherTime =
            minuteDelta !== null
              ? addMinutesToTime(other.time, minuteDelta)
              : other.time;
          const otherDate = formatDate(
            new Date(
              parseLocalDate(other.date).getTime() + dayDelta * DAY_IN_MS,
            ),
          );

          previews.push({
            id,
            date: otherDate,
            startTime: otherTime,
            duration: other.duration ?? 60,
            color: other.color ?? '#2196F3',
            plan: other.plan,
          });
        }
      }
    }

    schedulePreviewUpdate(previews);
  } else {
    schedulePreviewUpdate([]);
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
  const isCopy = e.ctrlKey || e.metaKey;
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = isCopy ? 'copy' : 'move';
  }
  if (isCopyDragActive.value !== isCopy) {
    isCopyDragActive.value = isCopy;
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

interface GroupTarget {
  id: string;
  date: string | null;
  time: string | null;
}

// Projects where the rest of a drag group lands, given the drop target
// computed for the primary dragged event — each member keeps its offset
// from the drop target rather than snapping to the exact same date/time.
// Shared by the move and copy drop paths so both treat the group the same.
function computeGroupTargets(
  sourceEvent: ProgramEvent,
  eventUpdate: ProgramEventUpdateData,
  groupIds: string[],
): GroupTarget[] {
  if (eventUpdate.date == null) {
    return groupIds.map((id) => ({ id, date: null, time: null }));
  }

  const dayDelta = sourceEvent.date
    ? daysBetweenDates(
        parseLocalDate(sourceEvent.date),
        parseLocalDate(eventUpdate.date),
      )
    : 0;
  const minuteDelta =
    sourceEvent.time && eventUpdate.time
      ? parseTimeToMinutes(eventUpdate.time)! -
        parseTimeToMinutes(sourceEvent.time)!
      : null;

  const targets: GroupTarget[] = [];
  for (const id of groupIds) {
    const other = events.find((value) => value.id === id);
    if (!other?.date) {
      continue;
    }
    const otherDate = formatDate(
      new Date(parseLocalDate(other.date).getTime() + dayDelta * DAY_IN_MS),
    );
    const otherTime =
      other.time && minuteDelta !== null
        ? addMinutesToTime(other.time, minuteDelta)
        : other.time;

    targets.push({ id, date: otherDate, time: otherTime });
  }
  return targets;
}

function onDrop(
  e: DragEvent,
  type: string,
  { scope }: { scope: DragAndDropScope },
): boolean {
  // Same DOM-remount caveat as onMoveToBacklog: don't rely on `dragend`
  // alone to clear the drag/dim state.
  resetDragState();
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
      const time = scope.timestamp.time ?? '';
      const [dh, dm] = time.split(':').map(Number);
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

  const groupIds = selectionGroup(eventId).filter((id) => id !== eventId);

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

    // Duplicate the rest of the selection too, at the same offset from the
    // drop target as the primary event — a copy-drag of a multi-selection
    // should copy the whole group, not just the event under the cursor.
    for (const target of computeGroupTargets(event, eventUpdate, groupIds)) {
      const other = events.find((value) => value.id === target.id);
      if (!other) {
        continue;
      }
      emit('add', {
        title: other.title,
        location: other.location,
        details: other.details,
        color: other.color,
        plan: other.plan,
        date: target.date,
        time: target.time,
        duration: other.duration,
      } as ProgramEventCreateData);
    }
    return false;
  }

  if (!canUpdate.value) {
    return false;
  }

  const actions: UndoAction[] = [
    {
      type: 'update',
      id: eventId,
      data: { date: event.date, time: event.time, duration: event.duration },
    },
  ];
  emit('update', eventId, eventUpdate);

  // Move the rest of the selection along with the dragged event, preserving
  // each event's offset from the drop target rather than snapping all of
  // them to the exact same date/time.
  for (const target of computeGroupTargets(event, eventUpdate, groupIds)) {
    const other = events.find((value) => value.id === target.id);
    if (other) {
      actions.push({
        type: 'update',
        id: target.id,
        data: { date: other.date, time: other.time },
      });
    }
    emit('update', target.id, { date: target.date, time: target.time });
  }

  pushUndo(actions);
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
    (date === start.date && time != undefined && time < start.time) ||
    date > end.date ||
    (date === end.date && time != undefined && time >= end.time);

  return { 'cal-outside-camp': outside };
}

function anchorWeekdayClass({
  scope,
}: {
  scope: { timestamp: Timestamp };
}): Record<string, boolean> {
  return { 'cal-anchor-day': scope.timestamp.date === anchorDate.value };
}

const selectedEventIds = ref<Set<string>>(new Set());

function isSelected(id: string): boolean {
  return selectedEventIds.value.has(id);
}

// Selection is a ctrl/cmd-only gesture: ctrl/cmd-click toggles an event within
// the current multi-selection so several events can be deleted or moved
// together, while a plain click just clears it and falls through to the
// event's normal click behavior (e.g. opening details).
function selectEvent(id: string, e: MouseEvent) {
  if (!e.ctrlKey && !e.metaKey) {
    clearSelection();
    return;
  }
  const next = new Set(selectedEventIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  selectedEventIds.value = next;
}

function clearSelection() {
  selectedEventIds.value = new Set();
}

// Resolves the set of event ids an action on `id` should apply to: the full
// selection when `id` is part of a multi-selection, otherwise just `id`.
function selectionGroup(id: string): string[] {
  if (selectedEventIds.value.has(id) && selectedEventIds.value.size > 1) {
    return Array.from(selectedEventIds.value);
  }
  return [id];
}

type UndoAction =
  | { type: 'update'; id: string; data: ProgramEventUpdateData }
  | { type: 'delete'; eventData: ProgramEventCreateData };

// One entry groups every sub-action of a single user gesture (a bulk delete,
// a multi-event drag, ...) so one undo reverts the whole gesture at once
// rather than requiring ctrl+Z once per affected event.
type UndoEntry = UndoAction[];

const undoStack: UndoEntry[] = [];

function pushUndo(entry: UndoEntry) {
  if (entry.length === 0) {
    return;
  }
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
    clearSelection();
  } else if (e.key === 'ArrowRight') {
    onNextNavigation();
  } else if (e.key === 'ArrowLeft') {
    onPreviousNavigation();
  } else if (e.key === 'p') {
    if (!canUpdate.value) {
      return;
    }
    const actions: UndoAction[] = [];
    for (const id of selectedEventIds.value) {
      const event = events.find((ev) => ev.id === id);
      if (!event) {
        continue;
      }
      actions.push({
        type: 'update',
        id: event.id,
        data: { plan: event.plan },
      });
      const nextPlan =
        event.plan === 'both' ? 'a' : event.plan === 'a' ? 'b' : 'both';
      emit('update', event.id, { plan: nextPlan });
    }
    pushUndo(actions);
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!canDelete.value) {
      return;
    }
    const ids = Array.from(selectedEventIds.value);
    clearSelection();
    const actions: UndoAction[] = [];
    for (const id of ids) {
      const event = events.find((ev) => ev.id === id);
      if (!event) {
        continue;
      }
      actions.push({
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
      emit('delete', event.id);
    }
    pushUndo(actions);
  } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    const entry = undoStack[undoStack.length - 1];
    if (!entry) {
      return;
    }
    const blocked = entry.some(
      (action) =>
        (action.type === 'update' && !canUpdate.value) ||
        (action.type === 'delete' && !canCreate.value),
    );
    if (blocked) {
      return;
    }
    undoStack.pop();
    for (const action of entry) {
      if (action.type === 'update') {
        emit('update', action.id, action.data);
      } else {
        emit('add', action.eventData);
      }
    }
  }
}

// Paging by a full window (range days). Paging is a fresh intent, so the anchor
// becomes the new (clamped) window start — keeping it in-range means the
// selected-day highlight always stays within the visible window. Clamping is a
// no-op when browsing outside the camp dates is enabled.
function onNextNavigation() {
  const next =
    parseLocalDate(selectedDate.value).getTime() + range.value * DAY_IN_MS;
  selectedDate.value = clampWindowStart(
    formatDate(new Date(next)),
    range.value,
  );
}

function onPreviousNavigation() {
  const prev =
    parseLocalDate(selectedDate.value).getTime() - range.value * DAY_IN_MS;
  selectedDate.value = clampWindowStart(
    formatDate(new Date(prev)),
    range.value,
  );
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

// The anchor day's date button, styled to match the built-in active-date look
// (which is disabled via `no-active-date`). MD3 tokens auto-switch, so this
// reads correctly in both light and dark themes.
.q-calendar-day__head--day.cal-anchor-day .q-calendar__button {
  color: var(--md3-on-primary);
  background: var(--md3-primary);
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

// Sits just above the overlay (z-index 0, later in DOM order) but below
// actual events, so it never visually competes with real content.
.cal-hover-slot {
  position: absolute;
  left: 2px;
  right: 2px;
  background-color: color-mix(in srgb, var(--md3-primary) 6%, transparent);
  border: 1px dashed color-mix(in srgb, var(--md3-primary) 45%, transparent);
  border-radius: 6px;
  pointer-events: none;
  transition: opacity 0.1s ease;
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
