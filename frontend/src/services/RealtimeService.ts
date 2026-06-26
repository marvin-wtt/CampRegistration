import type { RealtimeResource } from '@camp-registration/common/realtime';

// Each page-scoped stream is owned by its feature module, so the path mirrors
// that module's route (not a shared realtime namespace).
const RESOURCE_STREAM_PATH: Partial<Record<RealtimeResource, string>> = {
  program_event: 'program-events/events',
};

/**
 * Opens Server-Sent Event streams for live updates. Cookies (auth + session)
 * are sent automatically because the stream is same-origin as the API.
 */
export function useRealtimeService() {
  function streamUrl(campId: string, suffix: string): string {
    return `${window.origin}/api/v1/camps/${campId}/${suffix}`;
  }

  /** Ambient stream: camp + registration changes. */
  function openCampStream(campId: string): EventSource {
    return new EventSource(streamUrl(campId, 'events'), {
      withCredentials: true,
    });
  }

  /** Page-scoped stream for a single resource (e.g. program events). */
  function openResourceStream(
    campId: string,
    resource: RealtimeResource,
  ): EventSource {
    const path = RESOURCE_STREAM_PATH[resource] ?? 'events';
    return new EventSource(streamUrl(campId, path), {
      withCredentials: true,
    });
  }

  return {
    openCampStream,
    openResourceStream,
  };
}
