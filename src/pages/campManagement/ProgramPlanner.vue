<template>
  <!-- https://github.com/quasarframework/quasar-ui-qcalendar/blob/dev/demo/src/pages/Calendar.vue -->
  <page-state-handler
    :loading="loading"
    :error="error"
    padding
    class="column"
  >
    <div class="col-shrink">Header</div>

    <!-- TODO FIx element height -->
    <!-- Classes absolute fit is currently not working due to other style classes -->
    <q-calendar
      v-model="startAt"
      :view="view"
      :mood="mode"
      :weekdays="weekDays"
      :locale="locale"
      :max-days="maxDays"
      transition-prev="slide-right"
      transition-next="slide-left"
      :interval-minutes="intervalMinutes"
      :interval-start="intervalStart"
      :interval-count="intervalCount"
      :drag-enter-func="onDragEnter"
      :drag-over-func="onDragOver"
      :drag-leave-func="onDragLeave"
      :drag-end-func="onDragEnd"
      :drop-func="onDrop"
      hour24-format
      animated
    >
      <template
        #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }"
      >
        <calendar-item
          v-for="event in getEvents(timestamp.date)"
          :key="event.id"
          :event="event"
          :time-start-position="timeStartPos"
          :time-duration-height="timeDurationHeight"
        />
      </template>
    </q-calendar>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import {
  addToDate,
  compareTimestamps,
  diffTimestamp,
  isBetweenDates,
  parsed,
  parseTime,
  QCalendar,
  Timestamp
} from '@quasar/quasar-ui-qcalendar';
import { computed, CSSProperties, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCampDetailsStore } from 'stores/camp-details-store';
import CalendarItem from 'components/campManagement/programPlanner/CalendarItem.vue';
import { ProgramEvent } from 'src/types/ProgramEvent';
import { prevent, stop, stopAndPrevent } from 'quasar/src/utils/event';
import { CalendarEvent } from 'src/types/CalendarEvent';
import { colors } from 'quasar';

const campDetailsStore = useCampDetailsStore();
const { t, locale } = useI18n();

const loading = computed<boolean>(() => {
  return campDetailsStore.isLoading;
});

const error = computed<unknown>(() => {
  return campDetailsStore.error;
});

const settings = ref({
  daysPerWeek: 8,
  dayStart: '09:30',
  dayEnd: '18:15',
  timeIntervalMinutes: 30,
});

const startAt = ref('2023-07-29');
const mode = ref('day');
const view = ref();
const weekDays = ref<number[]>([1, 2, 3, 4, 5, 6, 0]);

const dragging = ref(false);
const draggedEvent = ref<CalendarEvent>();

const intervalMinutes = computed<number | undefined>(() => {
  return settings.value.timeIntervalMinutes;
});

const intervalCount = computed<number | undefined>(() => {
  const intervalMinutes = settings.value.timeIntervalMinutes;
  const dayStart = settings.value.dayStart ?? '00:00';
  const dayEnt = settings.value.dayEnd ?? '24:00';

  if (intervalMinutes === undefined || intervalMinutes === 0) {
    return undefined;
  }

  const start = getTime(dayStart);
  const end = getTime(dayEnt);
  const diff = end - start;

  return Math.floor(diff / intervalMinutes);
});

const intervalStart = computed<number | undefined>(() => {
  const intervalMinutes = settings.value.timeIntervalMinutes;
  const dayStart = settings.value.dayStart;
  if (
    dayStart === undefined ||
    intervalMinutes === undefined ||
    intervalMinutes === 0
  ) {
    return undefined;
  }

  const start = getTime(dayStart);

  return Math.floor(start / intervalMinutes);
});

const maxDays = computed<number>(() => {
  if (campDetailsStore.data === undefined) {
    return 0;
  }

  return calculateDaysBetween(
    campDetailsStore.data.startAt,
    campDetailsStore.data.endAt
  );
});

// TODO https://qcalendar.netlify.app/developing/qcalendarday-week/week-drag-and-drop
// TODO https://qcalendar.netlify.app/developing/qcalendarday-week/week-slot-day-body

function isCssColor(color) {
  return !!color && !!color.match(/^(#|(rgb|hsl)a?\()/);
}

function badgeClasses(event: ProgramEvent, type: string) {
  const cssColor = isCssColor(event.backgroundColor);
  const isHeader = type === 'header';
  return {
    [`text-white bg-${event.backgroundColor}`]: !cssColor,
    'full-width': !isHeader && (!event.side || event.side === 'full'),
    'left-side': !isHeader && event.side === 'left',
    'right-side': !isHeader && event.side === 'right',
  };
}

function badgeStyles(event: ProgramEvent, type: string, timeStartPos?, timeDurationHeight?) {
  const s: CSSProperties = {};
  if (isCssColor(event.backgroundColor)) {
    s.backgroundColor = event.backgroundColor;
    s.color = colors.luminosity(event.backgroundColor) > 0.5 ? 'black' : 'white';
  }
  if (timeStartPos) {
    // don't clamp position to 0px
    s.top = timeStartPos(event.time, false) + 'px';
    s.position = 'absolute';
    if (event.side !== undefined) {
      s.width = '50%';
      if (event.side === 'right') {
        s.left = '50%';
      }
    } else {
      s.width = '100%';
    }
  }
  if (timeDurationHeight) {
    s.height = timeDurationHeight(event.duration) + 'px';
  }
  s.alignItems = 'flex-start';
  return s;
}

function showEvent (event: ProgramEvent) {
  // TODO Open dialog
}

function onDragStart(e, event) {
  dragging.value = true;
  draggedEvent.value = event;
  stop(e);

  // TODO Is this needed?
  // e.dataTransfer.dropEffect = 'copy';
  // e.dataTransfer.effectAllowed = 'move';
  // e.dataTransfer.setData('ID', event.id);
}

function onDragEnter(e, event) {
  prevent(e);
}

function onDragOver(e, event: ProgramEvent, type: string) {
  // TODO
  // if (type === 'day') {
  //   stopAndPrevent(e);
  //   return draggedEvent.value.date !== day.date;
  // } else if (type === 'interval') {
  //   stopAndPrevent(ev);
  //   return (
  //     this.draggedEvent.date !== day.date && this.draggedEvent.time !== day.time
  //   );
  // }
}

function onDragEnd(e, event) {
  stopAndPrevent(e);
  // TODO Reset drag
}

function onDragLeave(e, type, scope) {
  console.log('onDragLeave');
  return false;
}

function onDrop(e, type, scope) {
  // console.log('onDrop', type, scope)
  // const itemID = parseInt(e.dataTransfer.getData('ID'), 10)
  // const event = { ...this.defaultEvent }
  // event.id = this.events.length + 1
  // const item = this.dragItems.filter(item => item.id === itemID)
  // event.type = item[ 0 ].id
  // event.name = item[ 0 ].name
  // event.date = scope.timestamp.date
  // if (type === 'interval') {
  //   event.time = scope.timestamp.time
  // }
  // else { // head-day
  //   event.allDay = true
  // }
  // this.events.push(event)
  return false;
}

function getTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateDaysBetween(startAt: string, endAt: string): number {
  const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24; // number of milliseconds in one day
  const start = new Date(startAt); // make a copy of the start date
  const end = new Date(endAt); // make a copy of the end date
  start.setHours(0, 0, 0, 0); // set the time to midnight
  end.setHours(0, 0, 0, 0); // set the time to midnight
  const diffInMs = end.getTime() - start.getTime(); // calculate the difference in milliseconds
  const diffInDays = Math.floor(diffInMs / ONE_DAY_IN_MS); // calculate the difference in days
  return diffInDays + 1; // add one to count every started day
}

const events = ref<ProgramEvent[]>([
  {
    id: '1',
    title: '1st of the Month',
    details: 'Everything is funny as long as it is happening to someone else',
    date: '2023-07-29',
    backgroundColor: 'orange',
  },
  {
    id: '2',
    title: 'Sisters Birthday',
    details: 'Buy a nice present',
    date: '2023-07-30',
    backgroundColor: 'green',
    icon: 'fas fa-birthday-cake',
  },
  {
    id: '3',
    title: 'Meeting',
    details: 'Time to pitch my idea to the company',
    date: '2023-07-31',
    time: '10:00',
    duration: 120,
    backgroundColor: 'red',
    icon: 'fas fa-handshake',
  },
  {
    id: '4',
    title: 'Lunch',
    details: 'Company is paying!',
    date: '2023-07-31',
    time: '11:15',
    duration: 90,
    backgroundColor: 'teal',
    icon: 'fas fa-hamburger',
  },
  {
    id: '41',
    title: 'Second Lunch',
    details: 'Company is paying!',
    date: '2023-07-31',
    time: '12:00',
    duration: 90,
    backgroundColor: 'green',
    icon: 'fas fa-hamburger',
  },
  {
    id: '5',
    title: 'Visit mom',
    details: 'Always a nice chat with mom',
    date: '2023-07-30',
    time: '17:00',
    duration: 90,
    backgroundColor: 'grey',
    icon: 'fas fa-car',
  },
  {
    id: '6',
    title: 'Conference',
    details: 'Teaching Javascript 101',
    date: '2023-08-03',
    time: '08:00',
    duration: 540,
    backgroundColor: 'blue',
    icon: 'fas fa-chalkboard-teacher',
  },
  {
    id: '7',
    title: 'Girlfriend',
    details: 'Meet GF for dinner at Swanky Restaurant',
    date: '2023-08-04',
    time: '19:00',
    duration: 180,
    backgroundColor: 'teal',
    icon: 'fas fa-utensils',
  },
]);

const eventsMap = computed(() => {
  const map = {};
  // this.events.forEach(event => (map[ event.date ] = map[ event.date ] || []).push(event))
  events.value.forEach((event) => {
    if (!map[event.date]) {
      map[event.date] = [];
    }
    map[event.date].push(event);
  });

  return map;
});

function getEvents(date: string): ProgramEvent[] {
  // get all events for the specified date
  const events = eventsMap.value[date] || [];

  // Convert all times to timestamps first
  const eventTimes: {
    start: Timestamp;
    end: Timestamp;
  }[] = events.map((event) => {
    const start = addToDate(parsed(event.date), {
      minute: parseTime(event.time),
    });
    const end = addToDate(start, { minute: event.duration });

    return {
      start: start,
      end: end,
    };
  });

  // Set the side of all events
  for (let i = 0; i < events.length; i++) {
    // Look ahead - all events in the past are already assigned
    // Technically, the last element could be skipped as it can't be compared
    for (let j = i + 1; j < events.length; j++) {
      // Check if timestamps overlap
      const overlapping =
        isBetweenDates(
          eventTimes[j].start,
          eventTimes[i].start,
          eventTimes[i].end,
          true
        ) ||
        isBetweenDates(
          eventTimes[j].end,
          eventTimes[i].start,
          eventTimes[i].end,
          true
        );
      // Check if start and end are equal. This is considered as between but
      //  should be ignored here.
      const continuous =
        compareTimestamps(eventTimes[i].start, eventTimes[j].end) ||
        compareTimestamps(eventTimes[j].start, eventTimes[i].end);

      // Skip all event that do not overlap
      if (!overlapping || continuous) {
        continue;
      }

      // Both events overlap. If one event has a side defined, assign the
      //  other side to the other element. If both elements don't have a side
      //  defined, the earlier event gets the left side.
      if (events[i].side === undefined) {
        // Other element has already a side. So take the other one
        if (events[j].side !== undefined) {
          events[i].side = events[j].side === 'left' ? 'right' : 'left';
          continue;
        }

        // Compare who starts first
        events[i].side =
          diffTimestamp(eventTimes[i].start, eventTimes[j].start, true) >= 0
            ? 'left'
            : 'right';
      }

      // Set side of second element if not already set
      if (events[j].side !== undefined) {
        continue;
      }

      events[j].side = events[i].side === 'left' ? 'right' : 'left';
    }

    events[i] ??= 'full';
  }

  return events;
}
</script>

<style lang="sass" scoped>
.my-event
  position: absolute
  font-size: 12px
  justify-content: center
  margin: 0 1px
  text-overflow: ellipsis
  overflow: hidden
  cursor: pointer

.title
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%

.text-white
  color: white

.bg-blue
  background: blue

.bg-green
  background: green

.bg-orange
  background: orange

.bg-red
  background: red

.bg-teal
  background: teal

.bg-grey
  background: grey

.bg-purple
  background: purple

.full-width
  left: 0
  width: calc(100% - 2px)

.left-side
  left: 0
  width: calc(50% - 3px)

.right-side
  left: 50%
  width: calc(50% - 3px)

  .rounded-border
    border-radius: 2px
</style>
