import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Event } from '@camp-registration/common/entities';
import { zonedInstant } from '@camp-registration/common/utils';
import { useEventDetailsStore } from '@/stores/event-details-store';
import {
  daysBetweenDates,
  formatLocalDate,
  parseLocalDate,
} from '@/utils/date';

export const EVENT_PHASES = [
  'setup',
  'registration',
  'preparation',
  'running',
  'wrapUp',
] as const;

export type EventPhase = (typeof EVENT_PHASES)[number];

function isEventPhase(value: unknown): value is EventPhase {
  return EVENT_PHASES.includes(value as EventPhase);
}

/** The event's dates decide first, so late registrations don't hide a running event. */
export function eventPhaseOf(event: Event, now = Date.now()): EventPhase {
  const startAt = zonedInstant(event.startAt, event.timezone).getTime();
  const endAt = zonedInstant(event.endAt, event.timezone).getTime();

  if (now > endAt) {
    return 'wrapUp';
  }
  if (now >= startAt) {
    return 'running';
  }

  switch (event.registrationStatus) {
    case 'open':
      return 'registration';
    case 'upcoming':
      return 'setup';
    case 'closed':
      // Without a registration window the event was never opened.
      return event.registrationOpensAt || event.registrationClosesAt
        ? 'preparation'
        : 'setup';
  }
}

/** Calendar dates (`YYYY-MM-DD`) of the event's first and last day. */
export function eventDays(event: Event): { first: string; last: string } {
  return { first: event.startAt.slice(0, 10), last: event.endAt.slice(0, 10) };
}

/** Today while the event runs, its first day otherwise (e.g. a previewed phase). */
export function shownEventDate(event: Event): string {
  const today = formatLocalDate(new Date());
  const { first, last } = eventDays(event);
  return today >= first && today <= last ? today : first;
}

/** 1-based day of the event `date` falls on, and the event's length in days. */
export function eventDayOf(
  event: Event,
  date: string,
): { day: number; days: number } {
  const { first, last } = eventDays(event);
  const start = parseLocalDate(first);

  return {
    day: daysBetweenDates(start, parseLocalDate(date)) + 1,
    days: daysBetweenDates(start, parseLocalDate(last)) + 1,
  };
}

/**
 * The phase the dashboard is laid out for. It follows the event, but a manager
 * can preview another phase through `?phase=`, e.g. to check the running
 * layout ahead of the event.
 */
export function useEventPhase() {
  const route = useRoute();
  const router = useRouter();
  const eventDetailsStore = useEventDetailsStore();

  const actualPhase = computed<EventPhase | undefined>(() =>
    eventDetailsStore.data ? eventPhaseOf(eventDetailsStore.data) : undefined,
  );

  const viewedPhase = computed<EventPhase | undefined>({
    get: () => {
      const phase = route.query.phase;
      return isEventPhase(phase) ? phase : actualPhase.value;
    },
    set: (phase) => {
      void router.replace({
        query: {
          ...route.query,
          phase: phase === actualPhase.value ? undefined : phase,
        },
      });
    },
  });

  const previewing = computed<boolean>(
    () =>
      actualPhase.value !== undefined &&
      viewedPhase.value !== actualPhase.value,
  );

  return { actualPhase, viewedPhase, previewing };
}
