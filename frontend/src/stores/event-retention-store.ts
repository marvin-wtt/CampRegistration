import { defineStore } from 'pinia';
import type {
  EventRetention,
  RetentionDeadlineKind,
  RetentionPostponeData,
} from '@camp-registration/common/privacy';
import { useRetentionService } from '@/services/RetentionService';
import { useResource, useRouteKey } from '@/composables/resource';
import { useEventDetailsStore } from '@/stores/event-details-store';

/** An event's retention deadlines (docs/privacy.md, 8). Purging is final. */
export const useEventRetentionStore = defineStore('eventRetention', () => {
  const service = useRetentionService();
  const eventDetailsStore = useEventDetailsStore();
  const retention = useResource<EventRetention>({
    name: 'eventRetention',
    key: useRouteKey('eventId'),
    fetch: (eventId) => service.fetchEventRetention(eventId),
  });

  // Deadlines follow registrations and the event's dates, which change
  // without notice here, so every visit fetches them anew.
  function fetchData(eventId?: string) {
    retention.invalidate();
    return retention.load(eventId);
  }

  function postpone(kind: RetentionDeadlineKind, data: RetentionPostponeData) {
    return retention.mutate(
      'postpone',
      (eventId) => service.postponeDeadline(eventId, kind, data),
      { feedback: 'result', apply: (_, updated) => updated },
    );
  }

  // The event records the purge too (`registrationDataPurgedAt`).
  async function purge(kind: RetentionDeadlineKind) {
    await retention.mutate('purge', (eventId) => service.purge(eventId, kind), {
      feedback: 'progress',
      reload: true,
    });
    await eventDetailsStore.reload();
  }

  return {
    data: retention.data,
    isLoading: retention.isLoading,
    error: retention.error,
    reset: retention.reset,
    fetchData,
    postpone,
    purge,
  };
});
