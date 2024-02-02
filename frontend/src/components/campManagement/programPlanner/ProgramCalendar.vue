<template>
  <div class="column">
    <calendar-navigation-bar
      v-model="range"
      class="col-shrink"
      :start="props.camp.startAt"
      :end="props.camp.endAt"
      @next="onNextNavigation"
      @previous="onPreciousNavigation"
    />

    <div class="col relative-position">
      <q-calendar-day
        ref="calendar"
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
        hour24-format
        bordered
        hoverable
        animated
        transition-next="slide-left"
        transition-prev="slide-right"
        class="fit absolute"
      >
        <template #head-day-event="{ scope: { timestamp } }">
          <div class="column">
            <calendar-day-item
              v-for="event in getFullDayEvents(timestamp.date)"
              :key="event.id"
              :event="event"
              :draggable="true"
              @dragstart="onDragStart($event, event)"
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
          />
        </template>
      </q-calendar-day>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { QCalendarDay } from '@quasar/quasar-ui-qcalendar';
import { useI18n } from 'vue-i18n';
import type {
  CampDetails,
  ProgramEvent,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import CalendarNavigationBar from 'components/campManagement/programPlanner/CalendarNavigationBar.vue';
import CalendarItem from 'components/campManagement/programPlanner/CalendarItem.vue';
import CalendarDayItem from 'components/campManagement/programPlanner/CalendarDayItem.vue';
import { DragAndDropScope } from 'components/campManagement/programPlanner/DragAndDropScope';

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
  (e: 'update', id: string, event: Partial<ProgramEvent>): void;
  (e: 'add', event: Omit<ProgramEvent, 'id'>): void;
  (e: 'delete', id: string): void;
}>();

const { t, locale } = useI18n();
const quasar = useQuasar();

const selectedDate = ref<string>(initialSelectedDate());

const range = ref<number>(1);

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

function initialSelectedDate(): string {
  return props.camp.startAt.split('T')[0];
}

const eventsMap = computed<Record<string, ProgramEvent[]>>(() => {
  return props.events
    .filter(
      (event): event is ProgramEvent & Required<Pick<ProgramEvent, 'date'>> =>
        !!event.date,
    )
    .reduce(
      (map, event) => {
        if (!(event.date in map)) {
          map[event.date] = [];
        }
        map[event.date].push(event);

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

  let eventUpdate: Pick<ProgramEvent, 'time' | 'date' | 'duration' | 'side'>;
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
        time: undefined,
      };
      break;
    default:
      eventUpdate = {
        date: undefined,
        time: undefined,
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

function onNextNavigation() {
  // TODO How to shift
}

function onPreciousNavigation() {
  // TODO How to shift
}
</script>

<style lang="scss">
.droppable {
  box-shadow: inset 0 0 0 1px rgba(0, 140, 200, 0.8);
}
</style>
