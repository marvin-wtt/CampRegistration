<template>
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
      v-model="startDate"
      :view="view"
      :mood="mode"
      :weekdays="weekDays"
      :locale="locale"
      :max-days="maxDays"
      :interval-minutes="intervalMinutes"
      :interval-start="intervalStart"
      :interval-count="intervalCount"
      :drag-enter-func="onDragEnter"
      :drag-over-func="onDragOver"
      :drag-leave-func="onDragLeave"
      :drop-func="onDrop"
      hour24-format
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
import PageStateHandler from 'components/PageStateHandler.vue';
import {
  addToDate,
  compareTimestamps,
  diffTimestamp,
  isBetweenDates,
  parsed,
  parseTime,
  QCalendar,
  Timestamp,
} from '@quasar/quasar-ui-qcalendar';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCampDetailsStore } from 'stores/camp-details-store';
import CalendarItem from 'components/campManagement/programPlanner/CalendarItem.vue';
import { ProgramEvent } from 'src/types/ProgramEvent';

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

const startDate = ref('2023-07-29');
const mode = ref('day');
const view = ref();
const weekDays = ref<number[]>([1, 2, 3, 4, 5, 6, 0]);

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
    campDetailsStore.data.startDate,
    campDetailsStore.data.endDate
  );
});

// TODO https://qcalendar.netlify.app/developing/qcalendarday-week/week-drag-and-drop
// TODO https://qcalendar.netlify.app/developing/qcalendarday-week/week-slot-day-body

function onDragStart(event, item) {
  console.log('onDragStart called');
  event.dataTransfer.dropEffect = 'copy';
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('ID', item.id);
}

function onDragEnter(e, type, scope) {
  console.log('onDragEnter');
  e.preventDefault();
  return true;
}

function onDragOver(e, type, scope) {
  console.log('onDragOver');
  e.preventDefault();
  return true;
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

function calculateDaysBetween(startDate: string, endDate: string): number {
  const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24; // number of milliseconds in one day
  const start = new Date(startDate); // make a copy of the start date
  const end = new Date(endDate); // make a copy of the end date
  start.setHours(0, 0, 0, 0); // set the time to midnight
  end.setHours(0, 0, 0, 0); // set the time to midnight
  const diffInMs = end.getTime() - start.getTime(); // calculate the difference in milliseconds
  const diffInDays = Math.floor(diffInMs / ONE_DAY_IN_MS); // calculate the difference in days
  return diffInDays + 1; // add one to count every started day
}

// Event
interface Event {
  id: number;
  title: string;
  details?: string;
  date?: string;
  duration?: number;
  time?: string;
  backgroundColor?: string;
  side?: string;
  icon?: string;
}

const events = ref<Event[]>([
  {
    id: 1,
    title: '1st of the Month',
    details: 'Everything is funny as long as it is happening to someone else',
    date: '2023-07-29',
    backgroundColor: 'orange',
  },
  {
    id: 2,
    title: 'Sisters Birthday',
    details: 'Buy a nice present',
    date: '2023-07-30',
    backgroundColor: 'green',
    icon: 'fas fa-birthday-cake',
  },
  {
    id: 3,
    title: 'Meeting',
    details: 'Time to pitch my idea to the company',
    date: '2023-07-31',
    time: '10:00',
    duration: 120,
    backgroundColor: 'red',
    icon: 'fas fa-handshake',
  },
  {
    id: 4,
    title: 'Lunch',
    details: 'Company is paying!',
    date: '2023-07-31',
    time: '11:15',
    duration: 90,
    backgroundColor: 'teal',
    icon: 'fas fa-hamburger',
  },
  {
    id: 41,
    title: 'Second Lunch',
    details: 'Company is paying!',
    date: '2023-07-31',
    time: '12:00',
    duration: 90,
    backgroundColor: 'green',
    icon: 'fas fa-hamburger',
  },
  {
    id: 5,
    title: 'Visit mom',
    details: 'Always a nice chat with mom',
    date: '2023-07-30',
    time: '17:00',
    duration: 90,
    backgroundColor: 'grey',
    icon: 'fas fa-car',
  },
  {
    id: 6,
    title: 'Conference',
    details: 'Teaching Javascript 101',
    date: '2023-08-03',
    time: '08:00',
    duration: 540,
    backgroundColor: 'blue',
    icon: 'fas fa-chalkboard-teacher',
  },
  {
    id: 7,
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
