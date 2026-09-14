import { defineStore } from 'pinia';
import type { ProgramPublishedDay } from '@camp-registration/common/entities';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useEventBus } from '@/composables/bus';
import { useRealtimeCollection } from '@/composables/realtimeCollection';

/**
 * Published-day rows for the public program link. Each day is its own row
 * (see `ProgramPublishedDay`), so publishing/unpublishing one day is an
 * independent request — unlike the old settings-blob map, two managers
 * touching different days at once can't clobber each other.
 */
export const useProgramPublishedDayStore = defineStore(
  'program-published-day',
  () => {
    const route = useRoute();
    const apiService = useAPIService();
    const authBus = useAuthBus();
    const eventBus = useEventBus();
    const {
      data,
      isLoading,
      error,
      reset,
      invalidate,
      withErrorNotification,
      withProgressNotification,
      lazyFetch,
      backgroundFetch,
      checkNotNullWithError,
    } = useServiceHandler<ProgramPublishedDay[]>('programPublishedDay');

    authBus.on('logout', () => {
      reset();
    });

    eventBus.on('change', () => {
      invalidate();
    });

    // No per-id endpoint (published days are keyed by date, not fetched
    // individually) — every event coalesces into one debounced full reload,
    // same as `table_template` syncs.
    useRealtimeCollection<ProgramPublishedDay>('program_published_day', {
      data,
      invalidate,
      reload: () => fetchData(undefined, { background: true }),
    });

    async function fetchData(
      eventId?: string,
      opts?: { background?: boolean },
    ): Promise<void> {
      const cid = checkNotNullWithError(
        eventId ?? (route.params.eventId as string),
      );
      const fetcher = () => apiService.fetchProgramPublishedDays(cid);
      await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
    }

    function upsertEntry(day: ProgramPublishedDay) {
      const list = data.value ?? [];
      data.value = list.some((entry) => entry.date === day.date)
        ? list.map((entry) => (entry.date === day.date ? day : entry))
        : [...list, day];
    }

    async function publishDay(date: string, plan: 'a' | 'b' | 'both') {
      const eventId = route.params.eventId as string;
      checkNotNullWithError(eventId);

      const day = await withErrorNotification('publish', () =>
        apiService.publishProgramDay(eventId, date, plan),
      );

      if (day) {
        upsertEntry(day);
      }

      return day;
    }

    async function unpublishDay(date: string) {
      const eventId = route.params.eventId as string;
      checkNotNullWithError(eventId);

      let unpublished = false;
      await withErrorNotification('unpublish', async () => {
        await apiService.unpublishProgramDay(eventId, date);
        unpublished = true;
      });

      if (unpublished) {
        data.value = data.value?.filter((entry) => entry.date !== date);
      }
    }

    async function publishAllDays(plan: 'a' | 'b' | 'both') {
      const eventId = route.params.eventId as string;
      checkNotNullWithError(eventId);

      const days = await withProgressNotification('publishAll', () =>
        apiService.publishAllProgramDays(eventId, plan),
      );

      // Every day in the event just got published — the response is the
      // event's complete new set, not a partial update to merge in.
      data.value = days;

      return days;
    }

    return {
      reset,
      data,
      isLoading,
      error,
      fetchData,
      publishDay,
      unpublishDay,
      publishAllDays,
    };
  },
);
