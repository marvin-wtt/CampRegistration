<template>
  <div
    class="column"
    :class="quasar.platform.is.mobile ? 'reverse' : ''"
  >
    <calendar-navigation-bar
      v-model="range"
      class="col-shrink"
      :start="props.camp.startAt"
      :end="props.camp.endAt"
      :current="selectedDate"
      @next="onNextNavigation"
      @previous="onPreciousNavigation"
    />

    <q-resize-observer @resize="onPageResize" />

    <div class="col relative-position">
      <q-calendar-day
        ref="calendarRef"
        v-model="selectedDate"
        view="day"
        :drag-enter-func="onDragEnter"
        :drag-over-func="onDragOver"
        :drag-leave-func="onDragLeave"
        :drop-func="onDrop"
        :weekday-class="onWeekdayClass"
        :interval-class="onIntervalClass"
        :max-days="range"
        :interval-start="intervalStart"
        :interval-count="intervalCount"
        :interval-minutes="props.timeInterval"
        :interval-height="intervalHeight"
        hour24-format
        time-clicks-clamped
        bordered
        hoverable
        animated
        transition-next="slide-left"
        transition-prev="slide-right"
        class="fit absolute"
        @click-time="onTimeEventAdd"
        @click-day="onDayEventAdd"
        @click-head-day="onDayEventAdd"
      >
        <template #head-day-event="{ scope: { timestamp } }">
          <div class="column">
            <calendar-day-item
              v-for="event in getFullDayEvents(timestamp.date)"
              :key="event.id"
              :event="event"
              :draggable="true"
              @dragstart="onDragStart($event, event)"
              @edit="onEventEdit(event)"
              @delete="onEventDelete(event)"
            />
          </div>
        </template>

        <template
          #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }"
        >
          <calendar-item
            v-for="event in getEvents(timestamp.date)"
            :key="event.id"
            :event="event"
            :time-start-position="timeStartPos"
            :time-duration-height="timeDurationHeight"
            :draggable="true"
            @dragstart="onDragStart($event, event)"
            @edit="onEventEdit(event)"
            @delete="onEventDelete(event)"
          />
        </template>
      </q-calendar-day>
    </div>
  </div>
</template>

<script lang="ts" setup>
import '@quasar/quasar-ui-qcalendar/dist/index.css';
import { QCalendarDay, Timestamp } from '@quasar/quasar-ui-qcalendar';
import { useI18n } from 'vue-i18n';
import type {
  CampDetails,
  ProgramEvent,
  ProgramEventCreateData,
  ProgramEventUpdateData,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import { computed, onMounted, ref, watch } from 'vue';
import CalendarNavigationBar from 'components/campManagement/programPlanner/CalendarNavigationBar.vue';
import CalendarItem from 'components/campManagement/programPlanner/CalendarItem.vue';
import CalendarDayItem from 'components/campManagement/programPlanner/CalendarDayItem.vue';
import { DragAndDropScope } from 'components/campManagement/programPlanner/DragAndDropScope';
import PointerEvent from 'happy-dom/lib/event/events/PointerEvent';
import ProgramEventAddDialog from 'components/campManagement/programPlanner/dialogs/ProgramEventAddDialog.vue';

interface Props {
  camp: CampDetails;
  events: ProgramEvent[];
  dayStart?: string;
  dayEnd?: string;
  timeInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  dayStart: '08:00',
  dayEnd: '21:00',
  timeInterval: 30,
});

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

onMounted(() => {
  // TODO Find better solution
  setTimeout(() => {
    updateIntervalHeight();
  }, 500);
});

const intervalStart = computed<number>(() => {
  const start = props.dayStart.split(':');
  if (start.length !== 2) {
    return 0;
  }
  const minutes = parseInt(start[0]) * 60 + parseInt(start[1]);

  return minutes / props.timeInterval;
});

const intervalCount = computed<number>(() => {
  const end = props.dayEnd.split(':');
  if (end.length !== 2) {
    return 0;
  }
  const minutes = parseInt(end[0]) * 60 + parseInt(end[1]);

  return minutes / props.timeInterval - intervalStart.value;
});

const intervalHeight = ref<number>(10);

watch(intervalCount, () => {
  updateIntervalHeight();
});

function onPageResize() {
  updateIntervalHeight();
}

function updateIntervalHeight() {
  const el = document.getElementsByClassName('q-calendar-day__body')[0];
  if (!el) {
    return;
  }

  const height = el.clientHeight - 10;
  intervalHeight.value = height / intervalCount.value;
}

function initialRange(): number {
  switch (quasar.screen.name) {
    case 'xs':
      return 1;
    case 'sm':
      return 3;
    case 'md':
      return 5;
    case 'lg':
    case 'xl':
      return 7;
  }
}

function initialSelectedDate(): string {
  return formatDate(new Date(props.camp.startAt));
}

const eventsMap = computed<Record<string, ProgramEvent[]>>(() => {
  return props.events
    .filter((event) => event.date != null)
    .reduce(
      (map, event) => {
        if (!(event.date! in map)) {
          map[event.date!] = [];
        }
        map[event.date!].push(event);

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
  const events = eventsMap.value[date] || [];

  // TODO Apply side when side is auto

  return events;
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
      },
    })
    .onOk((programEvent: ProgramEventCreateData) => {
      emit('add', programEvent);
    });
}

function onTimeEventAdd({ scope }: CalendarEvent) {
  quasar
    .dialog({
      component: ProgramEventAddDialog,
      componentProps: {
        date: scope.timestamp.date,
        time: scope.timestamp.time,
        duration: props.timeInterval,
        dateTimeMin: props.camp.startAt,
        dateTimeMax: props.camp.endAt,
      },
    })
    .onOk((programEvent: ProgramEventCreateData) => {
      emit('add', programEvent);
    });
}

function onEventEdit(event: ProgramEvent) {
  // TODO
}

function onEventDelete(event: ProgramEvent) {
  // TODO Maybe add conform
  emit('delete', event.id);
}

function onDragStart(e: DragEvent, event: ProgramEvent): void {
  if (!e.dataTransfer) {
    return;
  }

  e.dataTransfer.dropEffect = 'copy';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('eventId', event.id);
}

function onDragEnter(
  e: DragEvent,
  type: string,
  scope: DragAndDropScope,
): boolean {
  e.preventDefault();
  return true;
}

function onDragOver(
  e: DragEvent,
  type: string,
  scope: DragAndDropScope,
): boolean {
  e.preventDefault();
  return true;
}

function onDragLeave(
  e: DragEvent,
  type: string,
  scope: DragAndDropScope,
): boolean {
  return false;
}

function onDrop(e: DragEvent, type: string, scope: DragAndDropScope): boolean {
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
      // Dropped on a time slot
      eventUpdate = {
        date: scope.timestamp.date,
        time: scope.timestamp.time,
        duration: event.duration ?? 60,
        side: event.side ?? 'auto',
      };
      break;
    case 'head-day':
      // Dropped on the header
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

  emit('update', eventId, eventUpdate);

  return false;
}

function onIntervalClass({ scope }: { scope: DragAndDropScope }) {
  return {
    droppable: scope.droppable,
  };
}

function onWeekdayClass({ scope }: { scope: DragAndDropScope }) {
  return {
    droppable: scope.droppable,
  };
}

const DAY_IN_MY = 24 * 60 * 60 * 1000;

function onNextNavigation() {
  const endDate = new Date(props.camp.endAt);
  endDate.setHours(0, 0);

  const endTime = endDate.getTime();
  const currentTime = new Date(selectedDate.value).getTime();

  const rangeTime = range.value * DAY_IN_MY;
  const maxTime = endTime - (rangeTime - DAY_IN_MY);
  const updateMs = Math.min(maxTime, currentTime + rangeTime);

  selectedDate.value = formatDate(new Date(updateMs));
}

function onPreciousNavigation() {
  const startDate = new Date(props.camp.startAt);
  startDate.setHours(0, 0);

  const startTime = startDate.getTime();
  const currentTime = new Date(selectedDate.value).getTime();

  const rangeTime = range.value * DAY_IN_MY;
  const minTime = currentTime - rangeTime;
  const updateMs = Math.max(startTime, minTime);

  selectedDate.value = formatDate(new Date(updateMs));
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
</script>

<style lang="scss">
.droppable {
  box-shadow: inset 0 0 0 1px rgba(0, 140, 200, 0.8);
}
</style>
