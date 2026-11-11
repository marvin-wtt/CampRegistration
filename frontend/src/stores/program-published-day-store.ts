import { defineStore } from 'pinia';
import type { ProgramPublishedDay } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';

type Plan = 'a' | 'b' | 'both';

// Days are identified by their date.
function upsertDay(
  list: ProgramPublishedDay[],
  day: ProgramPublishedDay,
): ProgramPublishedDay[] {
  return list.some((entry) => entry.date === day.date)
    ? list.map((entry) => (entry.date === day.date ? day : entry))
    : [...list, day];
}

/**
 * Published-day rows for the public program link. Each day is its own row
 * (see `ProgramPublishedDay`), so publishing/unpublishing one day is an
 * independent request — unlike the old settings-blob map, two managers
 * touching different days at once can't clobber each other.
 */
export const useProgramPublishedDayStore = defineStore(
  'program-published-day',
  () => {
    const api = useAPIService();
    // No per-id endpoint (days are keyed by date) — every live change
    // coalesces into one debounced full reload, like `table_template` syncs.
    const days = useCollection<ProgramPublishedDay>({
      name: 'programPublishedDay',
      key: useRouteKey('eventId'),
      fetch: (eventId) => api.fetchProgramPublishedDays(eventId),
      realtime: { resource: 'program_published_day' },
    });

    function fetchData(eventId?: string) {
      return days.load(eventId);
    }

    function publishDay(
      date: string,
      plan: Plan,
    ): Promise<ProgramPublishedDay> {
      return days.mutate(
        'publish',
        (eventId) => api.publishProgramDay(eventId, date, plan),
        { apply: upsertDay },
      );
    }

    async function unpublishDay(date: string): Promise<void> {
      await days.mutate(
        'unpublish',
        (eventId) => api.unpublishProgramDay(eventId, date),
        { apply: (list) => list.filter((entry) => entry.date !== date) },
      );
    }

    // The response is the event's complete new set, not a partial update.
    function publishAllDays(plan: Plan): Promise<ProgramPublishedDay[]> {
      return days.mutate(
        'publishAll',
        (eventId) => api.publishAllProgramDays(eventId, plan),
        { feedback: 'progress', apply: (_, all) => all },
      );
    }

    return {
      data: days.data,
      isLoading: days.isLoading,
      error: days.error,
      reset: days.reset,
      fetchData,
      publishDay,
      unpublishDay,
      publishAllDays,
    };
  },
);
