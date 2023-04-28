<template>
  <page-state-handler
    :loading="loading"
    :error="error"
    padding
  >
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
  isBetweenDates,
  parsed,
  parseTime,
  parseTimestamp,
  QCalendar,
} from '@quasar/quasar-ui-qcalendar';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCampDetailsStore } from 'stores/camp/camp-details-store';
import CalendarItem from 'components/camp-management/programPlanner/CalendarItem.vue';

const campDetailsStore = useCampDetailsStore();
const { t, locale } = useI18n();

type Mode = 'day' | 'month' | 'agenda' | 'resource' | 'scheduler' | 'task';
type View =
  | 'month'
  | 'month-interval'
  | 'week'
  | 'day'
  | 'month-scheduler'
  | 'week-scheduler'
  | 'day-scheduler'
  | 'month-agenda'
  | 'week-agenda'
  | 'day-agenda'
  | 'month-resource'
  | 'week-resource'
  | 'day-resource';

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

function getTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

const startDate = ref('2023-07-29');

const mode = ref<Mode>('day');
const view = ref<View>();

const weekDays = ref<number[]>([1, 2, 3, 4, 5, 6, 0]);

const maxDays = computed<number>(() => {
  if (campDetailsStore.data === undefined) {
    return 0;
  }

  return calculateDaysBetween(
    campDetailsStore.data.startDate,
    campDetailsStore.data.endDate
  );
});

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
  days?: number;
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
    if (event.days) {
      let timestamp = parseTimestamp(event.date);
      let days = event.days;
      do {
        timestamp = addToDate(timestamp, { day: 1 });
        if (!map[timestamp.date]) {
          map[timestamp.date] = [];
        }
        map[timestamp.date].push(event);
      } while (--days > 0);
    }
  });
  return map;
});

function getEvents(dt) {
  // get all events for the specified date
  const events = eventsMap.value[dt] || [];

  if (events.length === 1) {
    events[0].side = 'full';
  } else if (events.length === 2) {
    // this example does no more than 2 events per day
    // check if the two events overlap and if so, select
    // left or right side alignment to prevent overlap
    const startTime = addToDate(parsed(events[0].date), {
      minute: parseTime(events[0].time),
    });
    const endTime = addToDate(startTime, { minute: events[0].duration });
    const startTime2 = addToDate(parsed(events[1].date), {
      minute: parseTime(events[1].time),
    });
    const endTime2 = addToDate(startTime2, { minute: events[1].duration });
    if (
      isBetweenDates(startTime2, startTime, endTime, true) ||
      isBetweenDates(endTime2, startTime, endTime, true)
    ) {
      events[0].side = 'left';
      events[1].side = 'right';
    } else {
      events[0].side = 'full';
      events[1].side = 'full';
    }
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
