import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';
import type { EventDetails } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useResource, useRouteKey } from '@/composables/resource';
import type { Feedback } from '@/composables/action';
import { useEventBus } from '@/composables/bus';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import { useRealtimeStore } from '@/stores/realtime-store';
import { omitProperty } from '@/utils/omitProperty';

export const useEventDetailsStore = defineStore('eventDetails', () => {
  const router = useRouter();
  const api = useAPIService();
  const bus = useEventBus();
  const realtime = useRealtimeStore();
  const eventKey = useRouteKey('eventId');
  const details = useResource<EventDetails>({
    name: 'event',
    key: eventKey,
    fetch: (eventId) => api.fetchEvent(eventId),
  });

  bus.on('update', (event) => {
    if (event?.id !== details.data.value?.id) {
      return;
    }

    if ('form' in event) {
      // It carries all details; no need to fetch them.
      details.update(() => event as EventDetails);
    } else {
      void details.reload();
    }
  });

  bus.on('delete', (eventId) => {
    if (details.data.value?.id === eventId) {
      details.reset();
    }
  });

  // React to live changes pushed from other clients. Details are refetched
  // through REST (where permissions apply) rather than trusting pushed data.
  realtime.on('event', (event: RealtimeEvent) => {
    if (details.data.value?.id !== event.id) {
      return;
    }
    if (event.operation === 'deleted') {
      details.reset();
      bus.emit('delete', event.id);
      return;
    }
    void details.reload();
  });
  realtime.onReconnect('event', () => {
    if (details.data.value !== undefined && eventKey() !== undefined) {
      void details.reload();
    }
  });

  router.beforeEach((to, from) => {
    // Leaving the event only marks it stale: the page being left keeps
    // rendering until its route is resolved and its fade-out ends, and must
    // not see the event vanish. Entering an event starts loading it while
    // the page's chunk downloads; the page shows the loading state.
    const eventId = to.params.eventId as string | undefined;
    if (eventId === undefined) {
      if (from.params.eventId !== undefined) {
        details.invalidate();
      }
      return;
    }

    if (details.data.value === undefined || eventId !== from.params.eventId) {
      details.invalidate();
      void details.load(eventId);
    }
  });

  function fetchData(eventId?: string) {
    return details.load(eventId);
  }

  async function updateData(
    update: Partial<EventDetails>,
    feedback: Feedback = 'progress',
  ): Promise<EventDetails> {
    const event = await details.mutate(
      'update',
      (eventId) =>
        api.updateEvent(
          eventId,
          omitProperty(omitProperty(update, 'freePlaces'), 'id'),
        ),
      {
        feedback,
        ...(update.id ? { key: update.id } : {}),
        apply: (_, updated) => updated,
      },
    );
    bus.emit('update', event);
    return event;
  }

  return {
    data: details.data,
    isLoading: details.isLoading,
    error: details.error,
    reset: details.reset,
    reload: details.reload,
    fetchData,
    updateData,
  };
});
